const STORE_KEY = Symbol.for("whatsappconversation.messages");

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = [];
  }

  return globalThis[STORE_KEY];
}

export function getMessages() {
  return [...getStore()].sort(
    (a, b) => (a.receivedAt || a.timestamp) - (b.receivedAt || b.timestamp),
  );
}

export function addMessage(message) {
  const store = getStore();
  const nextMessage = {
    id: message.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    direction: message.direction,
    text: message.text || "",
    status: message.status || "sent",
    from: message.from || "",
    to: message.to || "",
    timestamp: message.timestamp || Date.now(),
    receivedAt: Date.now(),
  };

  const existingIndex = store.findIndex((item) => item.id === nextMessage.id);

  if (existingIndex >= 0) {
    store[existingIndex] = { ...store[existingIndex], ...nextMessage };
  } else {
    store.push(nextMessage);
  }

  return nextMessage;
}

export function updateMessageStatus(id, status) {
  const store = getStore();
  const message = store.find((item) => item.id === id);

  if (message) {
    message.status = status;
  }

  return message;
}
