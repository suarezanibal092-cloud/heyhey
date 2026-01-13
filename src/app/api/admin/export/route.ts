import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "users";
    const format = searchParams.get("format") || "xlsx";

    let data: Record<string, unknown>[] = [];
    let filename = "";

    switch (type) {
      case "users":
        const users = await prisma.user.findMany({
          include: {
            whatsappConnections: true,
            _count: { select: { webhookLogs: true } },
          },
        });
        data = users.map(u => ({
          ID: u.id,
          Email: u.email,
          Nombre: u.name || "",
          Rol: u.role,
          Conexiones: u.whatsappConnections.length,
          Webhooks: u._count.webhookLogs,
          "Fecha Registro": u.createdAt.toISOString(),
        }));
        filename = `usuarios_${new Date().toISOString().split("T")[0]}`;
        break;

      case "connections":
        const connections = await prisma.whatsAppConnection.findMany({
          include: { user: { select: { email: true, name: true } } },
        });
        data = connections.map(c => ({
          ID: c.id,
          Usuario: c.user.email,
          "Nombre Usuario": c.user.name || "",
          Teléfono: c.phoneNumber,
          "ID Teléfono": c.phoneNumberId,
          "WABA ID": c.wabaId,
          Negocio: c.businessName || "",
          Estado: c.status,
          "Fecha Conexión": c.connectedAt?.toISOString() || "",
          "Fecha Creación": c.createdAt.toISOString(),
        }));
        filename = `conexiones_${new Date().toISOString().split("T")[0]}`;
        break;

      case "messages":
        const messages = await prisma.message.findMany({
          orderBy: { createdAt: "desc" },
          take: 10000,
        });
        data = messages.map(m => ({
          ID: m.id,
          Dirección: m.direction,
          De: m.from,
          Para: m.to,
          Tipo: m.messageType,
          Contenido: m.content.substring(0, 500),
          Estado: m.status,
          "ID WhatsApp": m.whatsappMessageId || "",
          Fecha: m.createdAt.toISOString(),
        }));
        filename = `mensajes_${new Date().toISOString().split("T")[0]}`;
        break;

      case "webhooks":
        const webhooks = await prisma.webhookLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 10000,
          include: {
            user: { select: { email: true } },
            connection: { select: { phoneNumber: true } },
          },
        });
        data = webhooks.map(w => ({
          ID: w.id,
          Evento: w.eventType,
          Usuario: w.user?.email || "",
          Teléfono: w.connection?.phoneNumber || "",
          Procesado: w.processed ? "Sí" : "No",
          Payload: w.payload.substring(0, 500),
          Fecha: w.createdAt.toISOString(),
        }));
        filename = `webhooks_${new Date().toISOString().split("T")[0]}`;
        break;

      default:
        return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    }

    if (format === "csv") {
      // Create CSV
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // Create Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}
