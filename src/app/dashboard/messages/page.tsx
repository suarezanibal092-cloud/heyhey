"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeyHeyLogo } from "@/components/HeyHeyLogo";
import {
  Send,
  ArrowLeft,
  MessageSquare,
  Phone,
  Loader2,
  CheckCheck,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Connection {
  id: string;
  phoneNumber: string;
  businessName: string | null;
  status: string;
}

interface Message {
  id: string;
  direction: string;
  from: string;
  to: string;
  messageType: string;
  content: string;
  status: string;
  createdAt: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/whatsapp/connect");
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
        if (data.connections?.length > 0) {
          setSelectedConnection(data.connections[0]);
          fetchMessages(data.connections[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchConnections();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const fetchMessages = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/send?connectionId=${connectionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection || !newMessage.trim() || !recipientPhone.trim()) {
      setError("Completa todos los campos");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: selectedConnection.id,
          to: recipientPhone,
          message: newMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al enviar mensaje");
      } else {
        setNewMessage("");
        fetchMessages(selectedConnection.id);
      }
    } catch (err) {
      setError("Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfb]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ba5cc6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
            <HeyHeyLogo size={80} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enviar Mensajes</h1>

        {connections.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                No tienes conexiones de WhatsApp activas.
              </p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="mt-4 bg-[#ba5cc6] hover:bg-[#9b4dca]"
              >
                Conectar WhatsApp
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Connections List */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Conexiones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <button
                      key={conn.id}
                      onClick={() => {
                        setSelectedConnection(conn);
                        fetchMessages(conn.id);
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConnection?.id === conn.id
                          ? "bg-[#ba5cc6] text-white"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">{conn.phoneNumber}</span>
                      </div>
                      {conn.businessName && (
                        <p className={`text-xs mt-1 ${
                          selectedConnection?.id === conn.id ? "text-white/80" : "text-gray-500"
                        }`}>
                          {conn.businessName}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Send Message */}
            <Card className="border-0 shadow-lg md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#25D366]" />
                  Enviar Mensaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de destino
                    </label>
                    <Input
                      type="tel"
                      placeholder="+573238261825"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Incluye el código de país (ej: +52, +1, +34)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ba5cc6] focus:border-transparent resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sending || !selectedConnection}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg py-6"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    Enviar Mensaje
                  </Button>
                </form>

                {/* Message History */}
                {messages.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Historial de Mensajes
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.direction === "outbound"
                              ? "bg-[#dcf8c6] ml-8"
                              : "bg-gray-100 mr-8"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              {msg.direction === "outbound" ? `→ ${msg.to}` : `← ${msg.from}`}
                            </span>
                            <div className="flex items-center gap-1">
                              {msg.status === "sent" && <CheckCheck className="w-3 h-3 text-gray-400" />}
                              {msg.status === "delivered" && <CheckCheck className="w-3 h-3 text-blue-500" />}
                              {msg.status === "read" && <CheckCheck className="w-3 h-3 text-blue-500" />}
                              {msg.status === "pending" && <Clock className="w-3 h-3 text-gray-400" />}
                            </div>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
