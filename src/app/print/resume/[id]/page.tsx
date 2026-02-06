"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function PrintResumePage() {
  const { id } = useParams();
  const [html, setHtml] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResume() {
      const res = await fetch(`/api/cv/resumes/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.contentHtml) {
          setHtml(data.contentHtml);
        } else {
          setFallbackText(data.content);
        }
      } else {
        setError("Failed to load resume");
      }
      setLoading(false);
    }
    fetchResume();
  }, [id]);

  useEffect(() => {
    if (!loading && (html || fallbackText)) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, html, fallbackText]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading resume...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="print-page">
      <style>{`
        /* Screen styles */
        .print-page {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .print-toolbar {
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 1rem;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .print-toolbar button {
          padding: 0.5rem 1.5rem;
          margin: 0 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .print-toolbar .btn-primary {
          background: #1f2937;
          color: white;
          border: none;
        }
        .print-toolbar .btn-secondary {
          background: white;
          border: 1px solid #d1d5db;
        }
        .print-content {
          max-width: 800px;
          margin: 2rem auto;
          background: white;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.6;
          color: #1a1a1a;
        }
        .print-content h1 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
          border-bottom: 2px solid #333;
          padding-bottom: 0.5rem;
        }
        .print-content h2 {
          font-size: 1.1rem;
          margin: 1.25rem 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #ccc;
          padding-bottom: 0.25rem;
        }
        .print-content h3 {
          font-size: 1rem;
          margin: 0.75rem 0 0.25rem 0;
          font-weight: 600;
        }
        .print-content ul {
          margin: 0.25rem 0;
          padding-left: 1.25rem;
        }
        .print-content li {
          margin-bottom: 0.2rem;
          font-size: 0.9rem;
        }
        .print-content p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }
        .print-content pre {
          white-space: pre-wrap;
          font-family: inherit;
          margin: 0;
        }

        /* Print styles - hide everything except resume */
        @media print {
          @page {
            margin: 0.5in;
            size: letter;
          }
          html, body {
            background: white !important;
          }
          /* Hide the Next.js root layout elements */
          body > div > aside,
          body > div > div > header,
          .print-toolbar {
            display: none !important;
          }
          /* Make print content full page */
          .print-page {
            background: white !important;
            min-height: auto !important;
          }
          .print-content {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="print-toolbar">
        <button className="btn-primary" onClick={() => window.print()}>
          Save as PDF
        </button>
        <button className="btn-secondary" onClick={() => window.history.back()}>
          Back
        </button>
      </div>

      <div className="print-content">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre>{fallbackText}</pre>
        )}
      </div>
    </div>
  );
}
