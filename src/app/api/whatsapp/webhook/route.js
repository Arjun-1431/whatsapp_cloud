import { addMessage, updateMessageStatus } from "@/app/lib/conversation-store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = getWebhookParam(searchParams, "hub.mode", "hub_mode");
  const token = getWebhookParam(searchParams, "hub.verify_token", "hub_verify_token");
  const challenge = getWebhookParam(searchParams, "hub.challenge", "hub_challenge");
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (!mode && !token && !challenge) {
    return Response.json({
      ok: true,
      message: "WhatsApp webhook endpoint is running.",
      setup:
        "Use this URL as the Meta Callback URL, then paste WHATSAPP_VERIFY_TOKEN as the Verify token.",
    });
  }

  if (!verifyToken) {
    console.error("Missing WHATSAPP_VERIFY_TOKEN for webhook verification.");
    return Response.json(
      { error: "Webhook verify token is not configured on the server." },
      { status: 500 },
    );
  }

  if (mode === "subscribe" && token?.trim() === verifyToken) {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("WhatsApp webhook verification failed", {
    hasChallenge: Boolean(challenge),
    mode,
    tokenMatches: Boolean(token && token.trim() === verifyToken),
  });

  return Response.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const entries = payload.entry || [];
  const events = entries.flatMap((entry) =>
    (entry.changes || []).map((change) => ({
      businessAccountId: entry.id,
      field: change.field,
      value: change.value,
    })),
  );

  for (const event of events) {
    const messages = event.value?.messages || [];
    const statuses = event.value?.statuses || [];

    for (const message of messages) {
      addMessage({
        id: message.id,
        direction: "incoming",
        text: getMessageText(message),
        status: "received",
        from: message.from,
        timestamp: Number(message.timestamp || Date.now() / 1000) * 1000,
      });
    }

    for (const status of statuses) {
      updateMessageStatus(status.id, status.status);
    }
  }

  console.log("WhatsApp webhook event", JSON.stringify(events, null, 2));

  return Response.json({ received: true, events });
}

function getMessageText(message) {
  if (message.text?.body) {
    return message.text.body;
  }

  if (message.button?.text) {
    return message.button.text;
  }

  if (message.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }

  if (message.type) {
    return `[${message.type} message received]`;
  }

  return "[message received]";
}

function getWebhookParam(searchParams, dottedName, underscoredName) {
  return searchParams.get(dottedName) || searchParams.get(underscoredName);
}
