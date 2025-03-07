"use client";

import { useEffect, useState } from "react";

interface WebhookEvent {
  timestamp: string;
  success: boolean;
  data?: any;
}

export default function WebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  // Function to format the timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Function to fetch initial events
  const fetchInitialEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/webhook-events?format=json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        setLastEventTime(data.events[0].timestamp);
      }
    } catch (err) {
      setError("Failed to fetch webhook events");
      console.error("Error fetching webhook events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Set up SSE connection
  useEffect(() => {
    fetchInitialEvents();

    // Set up SSE connection
    const setupSSE = () => {
      const url = lastEventTime
        ? `/api/webhook-events?lastEventTime=${encodeURIComponent(
            lastEventTime
          )}`
        : "/api/webhook-events";

      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const newEvents = JSON.parse(event.data);
          if (newEvents && newEvents.length > 0) {
            setEvents((prevEvents) => {
              // Combine new events with existing ones, avoiding duplicates
              const combinedEvents = [...newEvents, ...prevEvents];
              // Remove duplicates based on timestamp
              const uniqueEvents = combinedEvents.filter(
                (event, index, self) =>
                  index ===
                  self.findIndex((e) => e.timestamp === event.timestamp)
              );
              // Sort by timestamp (newest first)
              uniqueEvents.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              );
              // Update last event time
              if (uniqueEvents.length > 0) {
                setLastEventTime(uniqueEvents[0].timestamp);
              }
              // Keep only the last 10 events
              return uniqueEvents.slice(0, 10);
            });
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error:", err);
        eventSource.close();
        // Try to reconnect after a delay
        setTimeout(setupSSE, 5000);
      };

      return eventSource;
    };

    const eventSource = setupSSE();

    // Clean up on unmount
    return () => {
      eventSource.close();
    };
  }, [lastEventTime]);

  if (loading) {
    return (
      <div className="razer-container p-4 rounded-lg w-full max-w-md mt-6">
        <h2 className="text-xl font-bold mb-4 text-[--razer-green]">
          Webhook Events
        </h2>
        <p>Loading webhook events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="razer-container p-4 rounded-lg w-full max-w-md mt-6">
        <h2 className="text-xl font-bold mb-4 text-[--razer-green]">
          Webhook Events
        </h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="razer-container p-4 rounded-lg w-full max-w-md mt-6">
      <h2 className="text-xl font-bold mb-4 text-[--razer-green]">
        Webhook Events
      </h2>

      {events.length === 0 ? (
        <p>No webhook events received yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li
              key={event.timestamp}
              className={`p-3 rounded-md ${
                event.success ? "bg-green-900/30" : "bg-red-900/30"
              }`}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`font-medium ${
                    event.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {event.success ? "Success" : "Failed"}
                </span>
                <span className="text-sm opacity-70">
                  {formatTime(event.timestamp)}
                </span>
              </div>
              {event.data && (
                <div className="mt-2 text-sm opacity-80">
                  {event.data.payload && <div>Payload received</div>}
                  {event.data.error && <div>Error: {event.data.error}</div>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
