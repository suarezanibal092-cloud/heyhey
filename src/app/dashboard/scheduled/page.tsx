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
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Connection {
  id: string;
  phoneNumber: string;
  businessName: string | null;
}

interface ScheduledMessage {
  id: string;
  recipientPhone: string;
  content: string;
  messageType: string;
  scheduledAt: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  connection: {
    phoneNumber: string;
    businessName: string | null;
  };
}

export default function ScheduledMessagesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newMessage, setNewMessage] = useState({
    connectionId: "",
    recipientPhone: "",
    content: "",
    scheduledDate: "",
    scheduledTime: "",
  });

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
      const [messagesRes, connectionsRes] = await Promise.all([
        fetch("/api/scheduled-messages"),
        fetch("/api/whatsapp/connect"),
      ]);

      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.scheduledMessages || []);
      }
      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(data.connections || []);
        if (data.connections?.length > 0 && !newMessage.connectionId) {
          setNewMessage((prev) => ({ ...prev, connectionId: data.connections[0].id }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMessage = async () => {
    try {
      const scheduledAt = new Date(
        `${newMessage.scheduledDate}T${newMessage.scheduledTime}`
      ).toISOString();

      const res = await fetch("/api/scheduled-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: newMessage.connectionId,
          recipientPhone: newMessage.recipientPhone,
          content: newMessage.content,
          scheduledAt,
        }),
      });

      if (res.ok) {
        setShowAddDialog(false);
        setNewMessage({
          connectionId: connections[0]?.id || "",
          recipientPhone: "",
          content: "",
          scheduledDate: "",
          scheduledTime: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error scheduling message:", error);
    }
  };

  const handleCancelMessage = async (id: string) => {
    if (!confirm("¿Cancelar este mensaje programado?")) return;
    try {
      const res = await fetch(`/api/scheduled-messages?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error cancelling message:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Enviado
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Fallido
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingMessages = messages.filter((m) => m.status === "pending");
  const completedMessages = messages.filter((m) => m.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Mensajes Programados</h1>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Programar Mensaje
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingMessages.length}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {messages.filter((m) => m.status === "sent").length}
                </p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {messages.filter((m) => m.status === "failed").length}
                </p>
                <p className="text-sm text-muted-foreground">Fallidos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Messages */}
        {pendingMessages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Próximos Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{msg.recipientPhone}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {msg.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(msg.scheduledAt), "PPp", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(msg.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelMessage(msg.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            {completedMessages.length > 0 ? (
              <div className="space-y-3">
                {completedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between p-4 border rounded-lg opacity-75"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{msg.recipientPhone}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(msg.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay historial de mensajes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar Mensaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Conexión de WhatsApp</Label>
              <select
                className="w-full mt-2 p-2 border rounded-lg bg-background"
                value={newMessage.connectionId}
                onChange={(e) => setNewMessage({ ...newMessage, connectionId: e.target.value })}
              >
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.businessName || conn.phoneNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Teléfono Destinatario</Label>
              <Input
                placeholder="+1234567890"
                value={newMessage.recipientPhone}
                onChange={(e) => setNewMessage({ ...newMessage, recipientPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>Mensaje</Label>
              <textarea
                className="w-full mt-2 p-3 border rounded-lg resize-none min-h-[100px] bg-background"
                placeholder="Escribe tu mensaje..."
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={newMessage.scheduledDate}
                  onChange={(e) => setNewMessage({ ...newMessage, scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={newMessage.scheduledTime}
                  onChange={(e) => setNewMessage({ ...newMessage, scheduledTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleScheduleMessage}>Programar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
