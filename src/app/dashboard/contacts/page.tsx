"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Building2,
  Tag,
  Users,
  StickyNote,
  MoreVertical,
  Trash2,
  Edit,
  Ban,
  Loader2,
} from "lucide-react";

interface ContactTag {
  id: string;
  name: string;
  color: string;
}

interface ContactGroup {
  id: string;
  name: string;
  color: string;
}

interface ContactNote {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  company: string | null;
  isBlocked: boolean;
  tags: { tag: ContactTag }[];
  groups: { group: ContactGroup }[];
  notes: ContactNote[];
  createdAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Form states
  const [newContact, setNewContact] = useState({ phoneNumber: "", name: "", email: "", company: "" });
  const [newTag, setNewTag] = useState({ name: "", color: "#6b7280" });
  const [newGroup, setNewGroup] = useState({ name: "", description: "", color: "#3b82f6" });
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [contactsRes, tagsRes, groupsRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/contacts/tags"),
        fetch("/api/contacts/groups"),
      ]);

      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setTags(data.tags || []);
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });

      if (res.ok) {
        setShowAddDialog(false);
        setNewContact({ phoneNumber: "", name: "", email: "", company: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const handleAddTag = async () => {
    try {
      const res = await fetch("/api/contacts/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });

      if (res.ok) {
        setShowAddTagDialog(false);
        setNewTag({ name: "", color: "#6b7280" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleAddGroup = async () => {
    try {
      const res = await fetch("/api/contacts/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      if (res.ok) {
        setShowAddGroupDialog(false);
        setNewGroup({ name: "", description: "", color: "#3b82f6" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding group:", error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedContact) return;
    try {
      const res = await fetch("/api/contacts/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: selectedContact.id, content: newNote }),
      });

      if (res.ok) {
        setShowNoteDialog(false);
        setNewNote("");
        fetchData();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("¿Eliminar este contacto?")) return;
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        setSelectedContact(null);
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Contactos</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddTagDialog(true)}>
              <Tag className="w-4 h-4 mr-2" />
              Nueva Etiqueta
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddGroupDialog(true)}>
              <Users className="w-4 h-4 mr-2" />
              Nuevo Grupo
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contacto
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contactos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tags filter */}
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>

            {/* Contacts Grid */}
            <div className="grid gap-3">
              {filteredContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedContact?.id === contact.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{contact.name || contact.phoneNumber}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {contact.tags.slice(0, 2).map(({ tag }) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {contact.isBlocked && (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredContacts.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No hay contactos
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div>
            {selectedContact ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detalles</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContact(selectedContact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {selectedContact.name || "Sin nombre"}
                      </h2>
                      <p className="text-sm text-muted-foreground">{selectedContact.phoneNumber}</p>
                    </div>
                  </div>

                  {selectedContact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {selectedContact.email}
                    </div>
                  )}

                  {selectedContact.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {selectedContact.company}
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Etiquetas</h4>
                    <div className="flex gap-1 flex-wrap">
                      {selectedContact.tags.map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </Badge>
                    </div>
                  </div>

                  {/* Groups */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Grupos</h4>
                    <div className="flex gap-1 flex-wrap">
                      {selectedContact.groups.map(({ group }) => (
                        <Badge
                          key={group.id}
                          variant="outline"
                          style={{ borderColor: group.color, color: group.color }}
                        >
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Notas</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNoteDialog(true)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {selectedContact.notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-2 bg-muted rounded-lg text-sm"
                        >
                          {note.content}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Selecciona un contacto
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Teléfono *</Label>
              <Input
                placeholder="+1234567890"
                value={newContact.phoneNumber}
                onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                placeholder="Juan Pérez"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="juan@email.com"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input
                placeholder="Empresa S.A."
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddContact}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Etiqueta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                placeholder="VIP"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                {["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"].map(
                  (color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${
                        newTag.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTag({ ...newTag, color })}
                    />
                  )
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTagDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTag}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={showAddGroupDialog} onOpenChange={setShowAddGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                placeholder="Clientes Premium"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                placeholder="Descripción del grupo..."
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                {["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"].map(
                  (color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${
                        newGroup.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewGroup({ ...newGroup, color })}
                    />
                  )
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGroupDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddGroup}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Nota</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Contenido</Label>
            <textarea
              className="w-full mt-2 p-3 border rounded-lg resize-none min-h-[100px] bg-background"
              placeholder="Escribe una nota..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddNote}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
