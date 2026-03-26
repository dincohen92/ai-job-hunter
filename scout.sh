#!/usr/bin/env bash
# scout.sh — Scout's CLI wrapper for the ai-job-hunter app
# Usage: ./scout.sh <command> [options]
#
# Commands:
#   auth                          Sign in and save session
#   search <query> [--remote] [--days 3|7|30]
#   jobs                          List all saved jobs
#   save-job <json-file>          Save a job from a JSON file
#   applications                  List all applications
#   update-app <id> <status>      Update application status
#   companies                     List all companies
#   add-company <json-file>       Add a company
#   research-company <id>         AI-research a company
#   find-roles <id>               Find open roles at a company
#   contacts                      List all contacts
#   add-contact <json-file>       Add a contact
#   log-interaction <id> <json>   Log a contact interaction
#   analytics                     Pipeline stats
#   recommend                     Generate AI job recommendations
#   pipeline                      Full pipeline report

set -euo pipefail

BASE="http://localhost:3000"
COOKIE_JAR=""  # Auth removed — no session needed

# ── Color output ──────────────────────────────────────────────────────────────
green()  { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
red()    { echo -e "\033[31m$*\033[0m"; }
bold()   { echo -e "\033[1m$*\033[0m"; }

# ── Helpers ───────────────────────────────────────────────────────────────────

check_server() {
  if curl -s --max-time 3 "$BASE" > /dev/null 2>&1; then
    return 0  # already running
  fi

  yellow "⚡ Server not running — starting it in the background..."
  pushd ~/code/ai-job-hunter > /dev/null
  npm run dev > /tmp/scout-server.log 2>&1 &
  echo $! > /tmp/scout-server.pid
  popd > /dev/null

  # Wait up to 15 seconds for the server to be ready
  local tries=0
  while [[ $tries -lt 15 ]]; do
    sleep 1
    if curl -s --max-time 2 "$BASE" > /dev/null 2>&1; then
      green "✅ Server ready at $BASE"
      return 0
    fi
    tries=$((tries + 1))
  done

  red "❌ Server failed to start after 15s. Check /tmp/scout-server.log"
  exit 1
}

api() {
  local method="$1"; shift
  local path="$1"; shift
  local extra_args=("$@")

  curl -s \
    -X "$method" \
    -H "Content-Type: application/json" \
    "${extra_args[@]}" \
    "$BASE$path"
}

require_auth() {
  : # Auth removed — no-op
}

pretty_json() {
  python3 -m json.tool 2>/dev/null || cat
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_auth() {
  check_server
  green "✅ Auth not required — app runs open on localhost"
}

cmd_search() {
  check_server; require_auth

  local query="${1:-product designer}"
  local remote="false"
  local days="3"

  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --remote) remote="true" ;;
      --days)   days="$2"; shift ;;
    esac
    shift
  done

  local date_filter
  case "$days" in
    1)  date_filter="today" ;;
    3)  date_filter="3days" ;;
    7)  date_filter="week" ;;
    30) date_filter="month" ;;
    *)  date_filter="week" ;;
  esac

  bold "🔍 Searching: \"$query\" | remote=$remote | datePosted=$date_filter"
  echo

  local encoded_query
  encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")

  api GET "/api/jobs/search?q=${encoded_query}&remote=${remote}&datePosted=${date_filter}&type=FULLTIME" \
    | python3 -c "
import sys, json

data = json.load(sys.stdin)
jobs = data.get('data', []) if isinstance(data, dict) else data
total = len(jobs)

print(f'Found {total} results\n')
for i, j in enumerate(jobs[:15], 1):
    title   = j.get('job_title', 'N/A')
    company = j.get('employer_name', 'N/A')
    loc     = j.get('job_city', '') or j.get('job_country', '')
    remote  = '🌐 Remote' if j.get('job_is_remote') else loc
    salary  = ''
    if j.get('job_min_salary'):
        salary = f\" | \${j['job_min_salary']:,.0f}–\${j.get('job_max_salary', 0):,.0f}\"
    url     = j.get('job_apply_link', '')
    ext_id  = j.get('job_id', '')
    print(f'{i:>2}. {title} @ {company}')
    print(f'    {remote}{salary}')
    print(f'    Apply: {url}')
    print(f'    ID: {ext_id}')
    print()
"
}

cmd_jobs() {
  check_server; require_auth
  bold "📋 Saved Jobs"
  echo
  api GET /api/jobs | python3 -c "
import sys, json
jobs = json.load(sys.stdin)
if not jobs:
    print('No saved jobs yet.')
else:
    for j in jobs:
        status = (j.get('application') or {}).get('status', 'unsaved')
        print(f\"[{j['id'][:8]}] {j['title']} @ {j['company']} — {status}\")
"
}

cmd_save_job() {
  check_server; require_auth
  local json_file="${1:-}"
  if [[ -z "$json_file" ]]; then
    red "Usage: ./scout.sh save-job <json-file>"
    exit 1
  fi
  bold "💾 Saving job from $json_file"
  api POST /api/jobs -d "@$json_file" | pretty_json
}

cmd_applications() {
  check_server; require_auth
  bold "📊 Application Pipeline"
  echo
  api GET /api/applications | python3 -c "
import sys, json
from datetime import datetime, timezone

apps = json.load(sys.stdin)
now  = datetime.now(timezone.utc)

buckets = {}
for a in apps:
    s = a.get('status', 'unknown')
    buckets.setdefault(s, []).append(a)

order = ['saved','applied','interviewing','offer','accepted','rejected']
for status in order:
    group = buckets.get(status, [])
    if not group: continue
    print(f'\n── {status.upper()} ({len(group)}) ──')
    for a in group:
        job   = a.get('job', {})
        title = job.get('title', 'N/A')
        co    = job.get('company', 'N/A')
        upd   = a.get('updatedAt','')[:10]
        stale = ''
        try:
            d     = datetime.fromisoformat(a['updatedAt'].replace('Z','+00:00'))
            delta = (now - d).days
            if delta >= 7 and status == 'applied':
                stale = f' ⚠ {delta}d stale'
        except: pass
        print(f'  [{a[\"id\"][:8]}] {title} @ {co} (updated {upd}){stale}')
"
}

cmd_update_app() {
  check_server; require_auth
  local id="${1:-}"; local status="${2:-}"
  if [[ -z "$id" || -z "$status" ]]; then
    red "Usage: ./scout.sh update-app <application-id> <status>"
    red "Valid statuses: saved | applied | interviewing | offer | accepted | rejected"
    exit 1
  fi
  bold "✏️  Updating application $id → $status"
  api PATCH "/api/applications/$id" -d "{\"status\":\"$status\"}" | pretty_json
}

cmd_companies() {
  check_server; require_auth
  bold "🏢 Companies"
  echo
  api GET /api/companies | python3 -c "
import sys, json
companies = json.load(sys.stdin)
if not companies:
    print('No companies saved yet.')
else:
    for c in companies:
        cnt = c.get('_count', {})
        print(f\"[{c['id'][:8]}] {c['name']} | {c.get('industry','?')} | {cnt.get('savedJobs',0)} jobs, {cnt.get('contacts',0)} contacts\")
"
}

cmd_add_company() {
  check_server; require_auth
  local json_file="${1:-}"
  if [[ -z "$json_file" ]]; then
    red "Usage: ./scout.sh add-company <json-file>"
    exit 1
  fi
  bold "🏢 Adding company from $json_file"
  api POST /api/companies -d "@$json_file" | pretty_json
}

cmd_research_company() {
  check_server; require_auth
  local id="${1:-}"
  if [[ -z "$id" ]]; then red "Usage: ./scout.sh research-company <company-id>"; exit 1; fi
  bold "🔬 AI-researching company $id..."
  api POST "/api/companies/$id/ai-research" | pretty_json
}

cmd_find_roles() {
  check_server; require_auth
  local id="${1:-}"
  if [[ -z "$id" ]]; then red "Usage: ./scout.sh find-roles <company-id>"; exit 1; fi
  bold "🔍 Finding open roles at company $id..."
  api GET "/api/companies/$id/find-roles" | pretty_json
}

cmd_contacts() {
  check_server; require_auth
  bold "👥 Contacts"
  echo
  api GET /api/contacts | python3 -c "
import sys, json
contacts = json.load(sys.stdin)
if not contacts:
    print('No contacts yet.')
else:
    for c in contacts:
        last = (c.get('interactions') or [{}])[0].get('date','never')[:10] if c.get('interactions') else 'never'
        print(f\"[{c['id'][:8]}] {c['name']} @ {c.get('company','?')} ({c.get('relationshipType','?')}) | last contact: {last}\")
"
}

cmd_add_contact() {
  check_server; require_auth
  local json_file="${1:-}"
  if [[ -z "$json_file" ]]; then red "Usage: ./scout.sh add-contact <json-file>"; exit 1; fi
  bold "👤 Adding contact from $json_file"
  api POST /api/contacts -d "@$json_file" | pretty_json
}

cmd_log_interaction() {
  check_server; require_auth
  local id="${1:-}"; local json_file="${2:-}"
  if [[ -z "$id" || -z "$json_file" ]]; then
    red "Usage: ./scout.sh log-interaction <contact-id> <json-file>"
    exit 1
  fi
  bold "📝 Logging interaction for contact $id"
  api POST "/api/contacts/$id/interactions" -d "@$json_file" | pretty_json
}

cmd_analytics() {
  check_server; require_auth
  bold "📈 Pipeline Analytics"
  echo
  api GET /api/analytics | pretty_json
}

cmd_recommend() {
  check_server; require_auth
  bold "💡 Generating AI job recommendations..."
  api POST /api/recommendations/generate | pretty_json
}

cmd_pipeline() {
  check_server; require_auth
  bold "═══════════════════════════════════════"
  bold "         SCOUT PIPELINE REPORT         "
  bold "═══════════════════════════════════════"
  echo

  echo "── APPLICATIONS ──"
  cmd_applications
  echo
  echo "── ANALYTICS ──"
  cmd_analytics
  echo
  echo "── COMPANIES ──"
  cmd_companies
}

# ── Dispatch ──────────────────────────────────────────────────────────────────

CMD="${1:-help}"
shift || true

case "$CMD" in
  auth)               cmd_auth ;;
  search)             cmd_search "$@" ;;
  jobs)               cmd_jobs ;;
  save-job)           cmd_save_job "$@" ;;
  applications)       cmd_applications ;;
  update-app)         cmd_update_app "$@" ;;
  companies)          cmd_companies ;;
  add-company)        cmd_add_company "$@" ;;
  research-company)   cmd_research_company "$@" ;;
  find-roles)         cmd_find_roles "$@" ;;
  contacts)           cmd_contacts ;;
  add-contact)        cmd_add_contact "$@" ;;
  log-interaction)    cmd_log_interaction "$@" ;;
  analytics)          cmd_analytics ;;
  recommend)          cmd_recommend ;;
  pipeline)           cmd_pipeline ;;
  help|*)
    bold "Scout CLI — ai-job-hunter wrapper"
    echo
    echo "Usage: ./scout.sh <command> [options]"
    echo
    echo "Commands:"
    echo "  search <query> [--remote] [--days 1|3|7|30]"
    echo "  jobs                            List saved jobs"
    echo "  save-job <json-file>            Save a job"
    echo "  applications                    List applications + flag stale"
    echo "  update-app <id> <status>        Update application status"
    echo "  companies                       List companies"
    echo "  add-company <json-file>         Add a company"
    echo "  research-company <id>           AI-research a company"
    echo "  find-roles <id>                 Find open roles at a company"
    echo "  contacts                        List contacts"
    echo "  add-contact <json-file>         Add a contact"
    echo "  log-interaction <id> <json>     Log a contact interaction"
    echo "  analytics                       Pipeline stats"
    echo "  recommend                       Generate AI job recommendations"
    echo "  pipeline                        Full pipeline report"
    ;;
esac
