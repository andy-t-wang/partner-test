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

// Function to get all webhook events
export function getWebhookEvents() {
    return webhookEvents;
}

// Function to get filtered webhook events
export function getFilteredWebhookEvents(lastEventTime: string | null) {
    return lastEventTime
        ? webhookEvents.filter((event) => event.timestamp > lastEventTime)
        : webhookEvents;
} 