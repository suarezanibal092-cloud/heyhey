import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Verify token for webhook setup
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "heyhey_webhook_token";

// GET - Webhook verification (required by Meta)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST - Receive webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Process the webhook payload
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        const wabaId = entry.id;

        // Find the connection by WABA ID
        const connection = await prisma.whatsAppConnection.findFirst({
          where: { wabaId },
        });

        for (const change of entry.changes || []) {
          const eventType = change.field;
          const value = change.value;

          // Log the webhook event
          await prisma.webhookLog.create({
            data: {
              connectionId: connection?.id,
              userId: connection?.userId,
              eventType,
              payload: JSON.stringify(value),
              processed: false,
            },
          });

          // Process different event types
          if (eventType === "messages") {
            await processMessages(value, connection?.id);
          } else if (eventType === "message_template_status_update") {
            await processTemplateStatus(value, connection?.id);
          }
        }
      }
    }

    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Process incoming messages
async function processMessages(value: Record<string, unknown>, connectionId?: string) {
  const messages = (value.messages as Array<Record<string, unknown>>) || [];

  for (const message of messages) {
    console.log("New message received:", {
      from: message.from,
      type: message.type,
      timestamp: message.timestamp,
      connectionId,
    });

    // Here you can add logic to:
    // - Store messages in database
    // - Forward to your chat system
    // - Trigger notifications
    // - Auto-reply based on rules
  }
}

// Process template status updates
async function processTemplateStatus(value: Record<string, unknown>, connectionId?: string) {
  console.log("Template status update:", {
    event: value.event,
    messageTemplateId: value.message_template_id,
    connectionId,
  });

  // Update template status in your database if needed
}
