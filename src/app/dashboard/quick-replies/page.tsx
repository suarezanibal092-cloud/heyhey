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
  Plus,
  Zap,
  Search,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Hash,
  MessageSquare,
} from "lucide-react";

interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: "general", label: "General", color: "#6b7280" },
  { value: "greeting", label: "Saludos", color: "#22c55e" },
  { value: "support", label: "Soporte", color: "#3b82f6" },
  { value: "sales", label: "Ventas", color: "#f97316" },
  { value: "closing", label: "Cierre", color: "#8b5cf6" },
];

export default function QuickRepliesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);

  const [formData, setFormData] = useState({
    shortcut: "",
    title: "",
    content: "",
    category: "general",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchQuickReplies();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const fetchQuickReplies = async () => {
    try {
      const res = await fetch("/api/quick-replies");
      if (res.ok) {
        const data = await res.json();
        setQuickReplies(data.quickReplies || []);
      }
    } catch (error) {
      console.error("Error fetching quick replies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const method = editingReply ? "PUT" : "POST";
      const body = editingReply
        ? { id: editingReply.id, ...formData }
        : formData;

      const res = await fetch("/api/quick-replies", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowDialog(false);
        setEditingReply(null);
        setFormData({ shortcut: "", title: "", content: "", category: "general" });
        fetchQuickReplies();
      }
    } catch (error) {
      console.error("Error saving quick reply:", error);
    }
  };

  const handleEdit = (reply: QuickReply) => {
    setEditingReply(reply);
    setFormData({
      shortcut: reply.shortcut,
      title: reply.title,
      content: reply.content,
      category: reply.category,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta respuesta rápida?")) return;
    try {
      const res = await fetch(`/api/quick-replies?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQuickReplies();
      }
    } catch (error) {
      console.error("Error deleting quick reply:", error);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const openAddDialog = () => {
    setEditingReply(null);
    setFormData({ shortcut: "", title: "", content: "", category: "general" });
    setShowDialog(true);
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.color || "#6b7280";
  };

  const filteredReplies = quickReplies.filter((reply) => {
    const matchesSearch =
      reply.title.toLowerCase().includes(search.toLowerCase()) ||
      reply.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      reply.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || reply.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <h1 className="text-xl font-bold">Respuestas Rápidas</h1>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Respuesta
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <p className="text-sm">
              Usa atajos como <code className="bg-muted px-1 rounded">/hola</code> mientras escribes
              para insertar respuestas rápidamente
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar respuestas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              Todas
            </Badge>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                className="cursor-pointer"
                style={{
                  backgroundColor: selectedCategory === cat.value ? cat.color : "transparent",
                  borderColor: cat.color,
                  color: selectedCategory === cat.value ? "white" : cat.color,
                }}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick Replies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReplies.map((reply) => (
            <Card key={reply.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono"
                      style={{
                        backgroundColor: `${getCategoryColor(reply.category)}20`,
                        color: getCategoryColor(reply.category),
                      }}
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {reply.shortcut}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(reply.content)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(reply)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(reply.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-medium mb-2">{reply.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{reply.content}</p>
              </CardContent>
            </Card>
          ))}

          {filteredReplies.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {search || selectedCategory
                    ? "No se encontraron respuestas"
                    : "No hay respuestas rápidas. Crea una para empezar."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingReply ? "Editar Respuesta" : "Nueva Respuesta Rápida"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Atajo</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    /
                  </span>
                  <Input
                    placeholder="hola"
                    value={formData.shortcut.replace(/^\//, "")}
                    onChange={(e) =>
                      setFormData({ ...formData, shortcut: `/${e.target.value}` })
                    }
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  className="w-full mt-2 p-2 border rounded-lg bg-background h-10"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Título</Label>
              <Input
                placeholder="Saludo inicial"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Contenido</Label>
              <textarea
                className="w-full mt-2 p-3 border rounded-lg resize-none min-h-[120px] bg-background"
                placeholder="¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: Usa variables como {"{nombre}"} para personalizar
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingReply ? "Guardar Cambios" : "Crear Respuesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
