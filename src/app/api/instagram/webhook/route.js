import {
  extractInstagramEvents,
  getInstagramConfig,
  replyToInstagramComment,
  sendInstagramMessage,
  verifyMetaSignature,
} from "@/app/lib/instagram";

const processedEventIds = Symbol.for("whatsappconversation.instagram.processedEventIds");

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = getWebhookParam(searchParams, "hub.mode", "hub_mode");
  const token = getWebhookParam(searchParams, "hub.verify_token", "hub_verify_token");
  const challenge = getWebhookParam(searchParams, "hub.challenge", "hub_challenge");
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN?.trim();

  if (!mode && !token && !challenge) {
    return Response.json({
      ok: true,
      message: "Instagram webhook endpoint is running.",
      setup:
        "Use this URL as the Meta Callback URL, then paste INSTAGRAM_VERIFY_TOKEN as the Verify token.",
    });
  }

  if (!verifyToken) {
    console.error("Missing INSTAGRAM_VERIFY_TOKEN for webhook verification.");
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

  console.warn("Instagram webhook verification failed", {
    hasChallenge: Boolean(challenge),
    mode,
    tokenMatches: Boolean(token && token.trim() === verifyToken),
  });

  return Response.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request) {
  const config = getInstagramConfig();
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (
    !verifyMetaSignature({
      rawBody,
      signatureHeader,
      appSecret: config.appSecret,
    })
  ) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 403 });
  }

  let payload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (!config.accessToken) {
    console.error("Missing INSTAGRAM_ACCESS_TOKEN for auto replies.");
    return Response.json(
      { error: "Instagram access token is not configured on the server." },
      { status: 500 },
    );
  }

  const events = extractInstagramEvents(payload, config.accountId);
  const results = [];

  for (const event of events) {
    if (hasProcessedEvent(event.id)) {
      results.push({ event, skipped: true, reason: "duplicate" });
      continue;
    }

    let result;

    if (event.type === "comment") {
      result = await replyToInstagramComment({
        commentId: event.commentId,
        message: config.commentReply,
        config,
      });
    }

    if (event.type === "message") {
      result = await sendInstagramMessage({
        recipientId: event.senderId,
        message: config.dmReply,
        config,
      });
    }

    markEventProcessed(event.id);
    results.push({ event, result });
  }

  console.log("Instagram webhook event", JSON.stringify({ events, results }, null, 2));

  return Response.json({ received: true, events, results });
}

function getWebhookParam(searchParams, dottedName, underscoredName) {
  return searchParams.get(dottedName) || searchParams.get(underscoredName);
}

function getProcessedEvents() {
  if (!globalThis[processedEventIds]) {
    globalThis[processedEventIds] = new Set();
  }

  return globalThis[processedEventIds];
}

function hasProcessedEvent(id) {
  return id ? getProcessedEvents().has(id) : false;
}

function markEventProcessed(id) {
  if (id) {
    getProcessedEvents().add(id);
  }
}
