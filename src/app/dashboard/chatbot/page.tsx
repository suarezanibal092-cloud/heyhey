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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Plus,
  Trash2,
  Zap,
  MessageSquare,
  Brain,
  Settings,
} from "lucide-react";

interface ChatbotFlow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  triggerValue: string | null;
  nodes: { id: string; nodeType: string; content: string }[];
  createdAt: string;
}

export default function ChatbotPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [flows, setFlows] = useState<ChatbotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // New flow form
  const [newFlow, setNewFlow] = useState({
    name: "",
    description: "",
    triggerType: "keyword",
    triggerValue: "",
    nodeType: "message",
    nodeContent: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchFlows();
    }
  }, [status, router]);

  const fetchFlows = async () => {
    try {
      const response = await fetch("/api/chatbot/flows");
      if (response.ok) {
        const data = await response.json();
        setFlows(data.flows || []);
      }
    } catch (error) {
      console.error("Error fetching flows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = async () => {
    if (!newFlow.name || !newFlow.nodeContent) return;

    setCreating(true);
    try {
      const response = await fetch("/api/chatbot/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFlow.name,
          description: newFlow.description,
          triggerType: newFlow.triggerType,
          triggerValue: newFlow.triggerValue,
          nodes: [
            {
              nodeType: newFlow.nodeType,
              content: newFlow.nodeContent,
              position: 0,
            },
          ],
        }),
      });

      if (response.ok) {
        await fetchFlows();
        setShowCreateDialog(false);
        setNewFlow({
          name: "",
          description: "",
          triggerType: "keyword",
          triggerValue: "",
          nodeType: "message",
          nodeContent: "",
        });
      }
    } catch (error) {
      console.error("Error creating flow:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm("¿Eliminar este flujo?")) return;

    try {
      await fetch("/api/chatbot/flows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchFlows();
    } catch (error) {
      console.error("Error deleting flow:", error);
    }
  };

  const toggleFlowActive = async (flow: ChatbotFlow) => {
    try {
      await fetch("/api/chatbot/flows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: flow.id,
          name: flow.name,
          description: flow.description,
          triggerType: flow.triggerType,
          triggerValue: flow.triggerValue,
          isActive: !flow.isActive,
          nodes: flow.nodes,
        }),
      });
      await fetchFlows();
    } catch (error) {
      console.error("Error updating flow:", error);
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chatbots</h1>
            <p className="text-gray-600">Automatiza respuestas con flujos y IA</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#ba5cc6] hover:bg-[#9b4dca]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Chatbot
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card
            className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setNewFlow({ ...newFlow, nodeType: "message" });
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Flujo con Reglas</h3>
                <p className="text-sm text-gray-500">Respuestas automáticas por palabras clave</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setNewFlow({ ...newFlow, nodeType: "ai_response" });
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Chatbot con IA</h3>
                <p className="text-sm text-gray-500">Respuestas inteligentes con ChatGPT</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flows List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#ba5cc6]" />
              Mis Chatbots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flows.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No tienes chatbots configurados</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Crear mi primer chatbot
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {flows.map((flow) => (
                  <div
                    key={flow.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          flow.nodes.some((n) => n.nodeType === "ai_response")
                            ? "bg-purple-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {flow.nodes.some((n) => n.nodeType === "ai_response") ? (
                          <Brain className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Zap className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{flow.name}</p>
                        <p className="text-sm text-gray-500">
                          {flow.triggerType === "keyword"
                            ? `Palabra clave: ${flow.triggerValue}`
                            : flow.triggerType === "all"
                            ? "Todos los mensajes"
                            : "Primer mensaje"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          flow.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {flow.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFlowActive(flow)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFlow(flow.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {newFlow.nodeType === "ai_response" ? (
                <>
                  <Brain className="w-5 h-5 text-purple-600" />
                  Nuevo Chatbot con IA
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-blue-600" />
                  Nuevo Flujo Automatizado
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {newFlow.nodeType === "ai_response"
                ? "Configura un chatbot inteligente que responde con IA"
                : "Crea respuestas automáticas basadas en palabras clave"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <Input
                placeholder="Ej: Bienvenida, Soporte, Ventas..."
                value={newFlow.name}
                onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
              <Input
                placeholder="Descripción del chatbot"
                value={newFlow.description}
                onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Activar cuando</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={newFlow.triggerType}
                onChange={(e) => setNewFlow({ ...newFlow, triggerType: e.target.value })}
              >
                <option value="keyword">Mensaje contiene palabra clave</option>
                <option value="all">Cualquier mensaje</option>
                <option value="first_message">Primer mensaje de la conversación</option>
              </select>
            </div>

            {newFlow.triggerType === "keyword" && (
              <div>
                <label className="block text-sm font-medium mb-1">Palabras clave</label>
                <Input
                  placeholder="hola, ayuda, precio (separadas por coma)"
                  value={newFlow.triggerValue}
                  onChange={(e) => setNewFlow({ ...newFlow, triggerValue: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {newFlow.nodeType === "ai_response" ? "Prompt del sistema (instrucciones para la IA)" : "Mensaje de respuesta"}
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg resize-none"
                rows={4}
                placeholder={
                  newFlow.nodeType === "ai_response"
                    ? "Eres un asistente de ventas amable. Ayuda a los clientes con información sobre productos..."
                    : "¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?"
                }
                value={newFlow.nodeContent}
                onChange={(e) => setNewFlow({ ...newFlow, nodeContent: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateFlow}
                disabled={creating || !newFlow.name || !newFlow.nodeContent}
                className="flex-1 bg-[#ba5cc6] hover:bg-[#9b4dca]"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Chatbot"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
