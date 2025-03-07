export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getFilteredWebhookEvents, getWebhookEvents } from "./utils";

// GET endpoint to retrieve webhook events using Server-Sent Events or regular JSON
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lastEventTime = searchParams.get("lastEventTime");
  const format = searchParams.get("format");

  // If format=json, return regular JSON response instead of SSE
  if (format === "json") {
    return NextResponse.json({ events: getWebhookEvents() });
  }

  // Otherwise, proceed with SSE
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
      const filteredEvents = getFilteredWebhookEvents(lastEventTime);

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

// HEAD endpoint for HTTP HEAD requests
export async function HEAD() {
  return new Response(null, { status: 200 });
}
