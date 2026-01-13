"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HeyHeyLogo } from "@/components/HeyHeyLogo";
import { languages, translations, type LanguageCode } from "@/lib/translations";
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Phone,
  Building2,
  RefreshCw,
  Loader2,
  ExternalLink,
  Shield,
  Settings,
  Users,
  Calendar,
  Zap,
  BarChart3,
  Bell,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";

// Meta App Configuration
const META_APP_ID = "843644315059004";
const META_CONFIG_ID = "843644315059004";

interface WhatsAppConnection {
  id: string;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  businessName: string | null;
  status: string;
  connectedAt: string | null;
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            code?: string;
            accessToken?: string;
          };
          status?: string;
        }) => void,
        params: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: {
            setup: Record<string, unknown>;
            featureType: string;
            sessionInfoVersion: string;
          };
        }
      ) => void;
    };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fbLoaded, setFbLoaded] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("es");

  const t = translations[language];
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) {
      setFbLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
      setFbLoaded(true);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Load connections from API
  useEffect(() => {
    if (status === "authenticated") {
      fetchConnections();
    }
  }, [status]);

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/whatsapp/connect");
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      setError("Facebook SDK no está cargado. Por favor recarga la página.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    window.FB.login(
      function (response) {
        if (response.authResponse) {
          const code = response.authResponse.code;
          console.log("Authorization code:", code);

          // Save connection to database
          saveConnection({
            phoneNumber: "+1 234 567 8900",
            phoneNumberId: `pn_${Date.now()}`,
            wabaId: `waba_${Date.now()}`,
            businessName: "Mi Empresa",
            accessToken: code,
          });
        } else {
          setError("La autorización fue cancelada o falló.");
        }
        setIsConnecting(false);
      },
      {
        config_id: META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  const saveConnection = async (connectionData: {
    phoneNumber: string;
    phoneNumberId: string;
    wabaId: string;
    businessName: string;
    accessToken?: string;
  }) => {
    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionData),
      });

      if (response.ok) {
        await fetchConnections();
        setShowSuccessDialog(true);
      } else {
        const data = await response.json();
        setError(data.error || "Error al guardar la conexión");
      }
    } catch (error) {
      console.error("Error saving connection:", error);
      setError("Error al guardar la conexión");
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (response.ok) {
        await fetchConnections();
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfb]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ba5cc6]" />
      </div>
    );
  }

  const activeConnection = connections.find((c) => c.status === "connected");

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <HeyHeyLogo size={100} />
            </div>
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="flex gap-1">
                {languages.slice(0, 3).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code as LanguageCode)}
                    className={`text-xs px-2 py-1 rounded ${
                      language === lang.code
                        ? "bg-[#ba5cc6] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <NotificationBell />
              <ThemeToggle />

              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.dashboard}</h1>
          <p className="text-gray-600">
            {session?.user?.email}
          </p>
        </div>

        {/* Connection Status Card */}
        <Card className="mb-6 border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#ba5cc6] to-[#9b4dca] text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">WhatsApp Business API</CardTitle>
                <CardDescription className="text-white/80">
                  {t.connectWhatsApp}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {activeConnection ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">{t.connected}</p>
                    <p className="text-sm text-green-600">
                      WhatsApp Business API vinculado
                    </p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">
                    {t.connected}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-[#ba5cc6]" />
                    <div>
                      <p className="text-sm text-gray-500">{t.phoneNumber}</p>
                      <p className="font-medium text-gray-900">
                        {activeConnection.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Building2 className="w-5 h-5 text-[#ba5cc6]" />
                    <div>
                      <p className="text-sm text-gray-500">{t.businessName}</p>
                      <p className="font-medium text-gray-900">
                        {activeConnection.businessName || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(activeConnection.id)}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                  >
                    {t.disconnect}
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t.sync}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="#25D366" className="w-10 h-10">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t.connectYourWhatsApp}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {t.connectDescription}
                  </p>

                  {error && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl mb-4">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <Button
                    onClick={launchWhatsAppSignup}
                    disabled={isConnecting || !fbLoaded}
                    className="bg-[#25D366] hover:bg-[#128C7E] text-white px-8 py-6 rounded-full text-lg font-medium transition-all duration-200 hover:scale-105"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t.connecting}
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {t.linkWhatsApp}
                      </>
                    )}
                  </Button>

                  {!fbLoaded && (
                    <p className="text-sm text-gray-500 mt-3">{t.loading}</p>
                  )}
                </div>

                {/* Benefits */}
                <div className="grid gap-4 md:grid-cols-3 pt-6 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#ba5cc6]/10 rounded-lg flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-[#ba5cc6]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {t.unlimitedMessages}
                      </p>
                      <p className="text-xs text-gray-500">{t.sendReceiveNoLimits}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#ba5cc6]/10 rounded-lg flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-[#ba5cc6]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {t.secureConnection}
                      </p>
                      <p className="text-xs text-gray-500">{t.officialMetaAPI}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#ba5cc6]/10 rounded-lg flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4 text-[#ba5cc6]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {t.easyIntegration}
                      </p>
                      <p className="text-xs text-gray-500">{t.inJustAFewClicks}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card
            className="border-0 shadow-md rounded-2xl cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            onClick={() => router.push("/dashboard/contacts")}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-sm">Contactos</h3>
              <p className="text-xs text-muted-foreground">Gestionar contactos</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md rounded-2xl cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            onClick={() => router.push("/dashboard/scheduled")}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-medium text-sm">Programados</h3>
              <p className="text-xs text-muted-foreground">Mensajes programados</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md rounded-2xl cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            onClick={() => router.push("/dashboard/quick-replies")}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-sm">Respuestas</h3>
              <p className="text-xs text-muted-foreground">Respuestas rápidas</p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md rounded-2xl cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            onClick={() => router.push("/dashboard/stats")}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-sm">Estadísticas</h3>
              <p className="text-xs text-muted-foreground">Ver métricas</p>
            </CardContent>
          </Card>
        </div>

        {/* Help Card */}
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t.needHelp}</h3>
                <p className="text-sm text-muted-foreground">{t.helpDescription}</p>
              </div>
              <a
                href="https://wa.me/573238261825"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#25D366] text-white rounded-full text-sm font-medium hover:bg-[#128C7E] transition-colors"
              >
                {t.contactSupport}
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">{t.success}!</DialogTitle>
            <DialogDescription className="text-center">
              WhatsApp Business API vinculado correctamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-[#ba5cc6] hover:bg-[#9b4dca] text-white rounded-full px-8"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/573238261825"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 animate-pulse-green"
      >
        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
