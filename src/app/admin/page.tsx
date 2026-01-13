"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HeyHeyLogo } from "@/components/HeyHeyLogo";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  MessageSquare,
  Phone,
  Activity,
  LogOut,
  RefreshCw,
  ChevronRight,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Send,
  BarChart3,
} from "lucide-react";

interface Stats {
  overview: {
    totalUsers: number;
    newUsersLast7Days: number;
    totalConnections: number;
    activeConnections: number;
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    totalWebhooks: number;
  };
  dailyData: { date: string; users: number; messages: number; webhooks: number }[];
  recentUsers: { id: string; email: string; name: string | null; createdAt: string }[];
  recentConnections: {
    id: string;
    phoneNumber: string;
    businessName: string | null;
    status: string;
    user: { email: string; name: string | null };
  }[];
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  whatsappConnections: { id: string; phoneNumber: string; status: string }[];
  _count: { webhookLogs: number };
}

interface WebhookLog {
  id: string;
  eventType: string;
  payload: string;
  createdAt: string;
  user: { email: string; name: string | null } | null;
  connection: { phoneNumber: string; businessName: string | null } | null;
}

const COLORS = ["#ba5cc6", "#25D366", "#3b82f6", "#f59e0b"];

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "webhooks">("stats");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole !== "admin") {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [status, session, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, webhooksRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/webhooks?limit=20"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (webhooksRes.ok) {
        const webhooksData = await webhooksRes.json();
        setWebhookLogs(webhooksData.webhookLogs);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfb]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ba5cc6]" />
      </div>
    );
  }

  const messagesPieData = stats
    ? [
        { name: "Entrantes", value: stats.overview.inboundMessages },
        { name: "Salientes", value: stats.overview.outboundMessages },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <HeyHeyLogo size={100} />
              <Badge className="bg-[#ba5cc6] text-white">Admin</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={fetchData} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Usuarios</p>
                  <p className="text-2xl font-bold">{stats?.overview.totalUsers || 0}</p>
                  <p className="text-xs text-green-600">
                    +{stats?.overview.newUsersLast7Days || 0} esta semana
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Conexiones</p>
                  <p className="text-2xl font-bold">{stats?.overview.activeConnections || 0}</p>
                  <p className="text-xs text-gray-500">
                    de {stats?.overview.totalConnections || 0} total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mensajes</p>
                  <p className="text-2xl font-bold">{stats?.overview.totalMessages || 0}</p>
                  <p className="text-xs text-gray-500">
                    {stats?.overview.inboundMessages || 0} in / {stats?.overview.outboundMessages || 0} out
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Webhooks</p>
                  <p className="text-2xl font-bold">{stats?.overview.totalWebhooks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            className={activeTab === "stats" ? "bg-[#ba5cc6] hover:bg-[#9b4dca]" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Estadísticas
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className={activeTab === "users" ? "bg-[#ba5cc6] hover:bg-[#9b4dca]" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </Button>
          <Button
            variant={activeTab === "webhooks" ? "default" : "outline"}
            onClick={() => setActiveTab("webhooks")}
            className={activeTab === "webhooks" ? "bg-[#ba5cc6] hover:bg-[#9b4dca]" : ""}
          >
            <Activity className="w-4 h-4 mr-2" />
            Webhooks
          </Button>
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && stats && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Activity Chart */}
            <Card className="border-0 shadow-lg md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#ba5cc6]" />
                  Actividad (Últimos 30 días)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#ba5cc6"
                      name="Usuarios"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      stroke="#25D366"
                      name="Mensajes"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="webhooks"
                      stroke="#3b82f6"
                      name="Webhooks"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Messages Pie Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Distribución de Mensajes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={messagesPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {messagesPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Connections */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Conexiones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentConnections.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Sin conexiones</p>
                  ) : (
                    stats.recentConnections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{conn.phoneNumber}</p>
                          <p className="text-xs text-gray-500">{conn.user.email}</p>
                        </div>
                        <Badge
                          className={
                            conn.status === "connected"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {conn.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Clientes Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay usuarios registrados</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#ba5cc6] rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || user.email}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {user.whatsappConnections.length > 0 ? (
                          <Badge className="bg-green-100 text-green-800">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {user.whatsappConnections.length}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Sin conexión
                          </Badge>
                        )}

                        <Badge
                          className={
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks Tab */}
        {activeTab === "webhooks" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Logs de Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhookLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay webhooks registrados</p>
                ) : (
                  webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">{log.eventType}</Badge>
                          {log.connection && (
                            <span className="text-sm text-gray-500">
                              {log.connection.phoneNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-24">
                        {log.payload.substring(0, 200)}
                        {log.payload.length > 200 ? "..." : ""}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
