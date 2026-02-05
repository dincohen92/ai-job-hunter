"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Linkedin,
  Loader2,
  Trash2,
  Plus,
  Calendar,
  MessageSquare,
  Video,
  Coffee,
  ExternalLink,
  Edit,
} from "lucide-react";
import Link from "next/link";

interface Interaction {
  id: string;
  type: string;
  date: string;
  notes: string | null;
  nextAction: string | null;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedInUrl: string | null;
  relationshipType: string;
  notes: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  interactions: Interaction[];
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  recruiter: "bg-blue-100 text-blue-800",
  hiring_manager: "bg-purple-100 text-purple-800",
  referral: "bg-green-100 text-green-800",
  peer: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

const INTERACTION_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Video,
  linkedin_message: MessageSquare,
  coffee_chat: Coffee,
};

const INTERACTION_TYPES = [
  { value: "email", label: "Email" },
  { value: "call", label: "Phone Call" },
  { value: "meeting", label: "Meeting" },
  { value: "linkedin_message", label: "LinkedIn Message" },
  { value: "coffee_chat", label: "Coffee Chat" },
];

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [interactionForm, setInteractionForm] = useState({
    type: "email",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    nextAction: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    company: "",
    role: "",
    email: "",
    phone: "",
    linkedInUrl: "",
    relationshipType: "other",
    notes: "",
  });

  const fetchContact = useCallback(async () => {
    const res = await fetch(`/api/contacts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setContact(data);
      setEditForm({
        name: data.name || "",
        company: data.company || "",
        role: data.role || "",
        email: data.email || "",
        phone: data.phone || "",
        linkedInUrl: data.linkedInUrl || "",
        relationshipType: data.relationshipType || "other",
        notes: data.notes || "",
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  async function handleDelete() {
    if (!confirm("Delete this contact?")) return;
    setDeleting(true);
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    router.push("/contacts");
  }

  async function handleAddInteraction(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/contacts/${id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(interactionForm),
    });

    if (res.ok) {
      setDialogOpen(false);
      setInteractionForm({
        type: "email",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        nextAction: "",
      });
      fetchContact();
    }
    setSaving(false);
  }

  async function handleUpdateContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditDialogOpen(false);
      fetchContact();
    }
    setSaving(false);
  }

  const formatRelationship = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-20 text-center text-gray-500">Contact not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <Badge
              className={
                RELATIONSHIP_COLORS[contact.relationshipType] ||
                RELATIONSHIP_COLORS.other
              }
            >
              {formatRelationship(contact.relationshipType)}
            </Badge>
          </div>
          {contact.role && contact.company && (
            <p className="text-gray-500">
              {contact.role} at {contact.company}
            </p>
          )}
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={editForm.company}
                    onChange={(e) =>
                      setEditForm({ ...editForm, company: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  value={editForm.linkedInUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, linkedInUrl: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select
                  value={editForm.relationshipType}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, relationshipType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="peer">Peer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contact.company && (
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-400" />
                <span>{contact.company}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.linkedInUrl && (
              <div className="flex items-center gap-3">
                <Linkedin className="h-4 w-4 text-gray-400" />
                <a
                  href={contact.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  LinkedIn Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {contact.notes && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-medium text-gray-600">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {contact.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Interaction History</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Log Interaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Interaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddInteraction} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select
                        value={interactionForm.type}
                        onValueChange={(v) =>
                          setInteractionForm({ ...interactionForm, type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERACTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={interactionForm.date}
                        onChange={(e) =>
                          setInteractionForm({
                            ...interactionForm,
                            date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={interactionForm.notes}
                      onChange={(e) =>
                        setInteractionForm({
                          ...interactionForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="What did you discuss?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Action</Label>
                    <Input
                      value={interactionForm.nextAction}
                      onChange={(e) =>
                        setInteractionForm({
                          ...interactionForm,
                          nextAction: e.target.value,
                        })
                      }
                      placeholder="Follow up on..."
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log Interaction
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {contact.interactions.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2">No interactions logged yet</p>
                <p className="text-sm">
                  Click &quot;Log Interaction&quot; to track your conversations
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contact.interactions.map((interaction) => {
                  const Icon = INTERACTION_ICONS[interaction.type] || MessageSquare;
                  return (
                    <div
                      key={interaction.id}
                      className="flex gap-4 rounded-lg border p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">
                            {interaction.type.replace("_", " ")}
                          </p>
                          <span className="text-sm text-gray-500">
                            {new Date(interaction.date).toLocaleDateString()}
                          </span>
                        </div>
                        {interaction.notes && (
                          <p className="mt-1 text-sm text-gray-600">
                            {interaction.notes}
                          </p>
                        )}
                        {interaction.nextAction && (
                          <p className="mt-2 text-sm text-blue-600">
                            Next: {interaction.nextAction}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
