export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// Simple in-memory event store (will be lost on server restart)
// In a production app, you might use Redis or another solution
let webhookEvents: { timestamp: string; success: boolean; data?: any }[] = [];

// Function to add a new webhook event
export function addWebhookEvent(success: boolean, data?: any) {
  const event = {
    timestamp: new Date().toISOString(),
    success,
    data,
  };
  webhookEvents.unshift(event); // Add to beginning of array

  // Keep only the last 10 events
  if (webhookEvents.length > 10) {
    webhookEvents = webhookEvents.slice(0, 10);
  }

  return event;
}

// GET endpoint to retrieve webhook events using Server-Sent Events
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lastEventTime = searchParams.get("lastEventTime");

  // Set headers for SSE
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial events
      const filteredEvents = lastEventTime
        ? webhookEvents.filter((event) => event.timestamp > lastEventTime)
        : webhookEvents;

      if (filteredEvents.length > 0) {
        const data = encoder.encode(
          `data: ${JSON.stringify(filteredEvents)}\n\n`
        );
        controller.enqueue(data);
      } else {
        // Send an empty array if no events
        const data = encoder.encode(`data: []\n\n`);
        controller.enqueue(data);
      }

      // Keep connection alive with a comment every 30 seconds
      const keepAliveInterval = setInterval(() => {
        const keepAlive = encoder.encode(`: keep-alive\n\n`);
        controller.enqueue(keepAlive);
      }, 30000);

      // Clean up interval on close
      req.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
      });
    },
  });

  return new Response(stream, { headers });
}

// GET endpoint to retrieve the latest webhook events without SSE
export async function HEAD(req: Request) {
  return NextResponse.json({ events: webhookEvents });
}
