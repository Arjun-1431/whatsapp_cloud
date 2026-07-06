const instagramEventStore = Symbol.for(
  "whatsappconversation.instagram.webhookEvents",
);

const MAX_EVENTS = 100;

export function addInstagramWebhookEvent(event) {
  const events = getInstagramWebhookEvents();
  const existingIndex = events.findIndex((item) => item.id === event.id);
  const savedEvent = {
    ...event,
    receivedAt: event.receivedAt || new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    events.splice(existingIndex, 1, savedEvent);
  } else {
    events.unshift(savedEvent);
  }

  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }

  return savedEvent;
}

export function getInstagramWebhookEvents() {
  if (!globalThis[instagramEventStore]) {
    globalThis[instagramEventStore] = [];
  }

  return globalThis[instagramEventStore];
}
