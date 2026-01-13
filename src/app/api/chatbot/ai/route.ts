import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default system prompt for the AI assistant
const DEFAULT_SYSTEM_PROMPT = `Eres un asistente virtual de HeyHey, una plataforma de WhatsApp Business.
Tu objetivo es ayudar a los clientes de manera amable y profesional.
Responde de forma concisa y útil. Si no sabes algo, dilo honestamente.
Responde en el mismo idioma en que te escriben.`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { message, conversationHistory, customPrompt } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Mensaje es requerido" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key no configurada" },
        { status: 500 }
      );
    }

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: customPrompt || DEFAULT_SYSTEM_PROMPT,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return NextResponse.json({
      response: aiResponse,
      usage: completion.usage,
    });
  } catch (error) {
    console.error("AI chatbot error:", error);
    return NextResponse.json(
      { error: "Error al generar respuesta de IA" },
      { status: 500 }
    );
  }
}
