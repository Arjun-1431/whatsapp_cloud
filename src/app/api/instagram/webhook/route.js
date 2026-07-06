import {
  extractInstagramEvents,
  getInstagramConfig,
  replyToInstagramComment,
  sendInstagramMessage,
  verifyMetaSignature,
} from "@/app/lib/instagram";
import { addInstagramWebhookEvent } from "@/app/lib/instagram-event-store";
import { generateInstagramAutoReply } from "@/app/lib/nvidia";

const processedEventIds = Symbol.for("whatsappconversation.instagram.processedEventIds");
const processedDmKeys = Symbol.for("whatsappconversation.instagram.processedDmKeys");
const DM_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

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
    const skipReason = getAutoReplySkipReason(event, config);

    if (skipReason) {
      markEventProcessed(event.id);
      addInstagramWebhookEvent({
        ...event,
        replyStatus: "skipped",
        replyError: skipReason,
      });
      results.push({ event, skipped: true, reason: skipReason });
      continue;
    }

    if (hasRecentlyProcessedDm(event)) {
      const duplicateDmReason = "Duplicate DM text ignored to prevent reply loops.";
      markEventProcessed(event.id);
      addInstagramWebhookEvent({
        ...event,
        replyStatus: "skipped",
        replyError: duplicateDmReason,
      });
      results.push({ event, skipped: true, reason: duplicateDmReason });
      continue;
    }

    if (hasProcessedEvent(event.id)) {
      const duplicateResult = { skipped: true, reason: "duplicate" };
      addInstagramWebhookEvent({
        ...event,
        replyStatus: "skipped",
        replyError: "Duplicate webhook event.",
      });
      results.push({ event, ...duplicateResult });
      continue;
    }

    let result = null;
    let replyStatus = "ignored";
    let replyError = "";
    const generatedReply = await generateInstagramAutoReply({
      event,
      fallbackMessage:
        event.type === "comment" ? config.commentReply : config.dmReply,
    });

    try {
      if (event.type === "comment") {
        result = await replyToInstagramComment({
          commentId: event.commentId,
          message: generatedReply.message,
          config,
        });
      }

      if (event.type === "message") {
        result = await sendInstagramMessage({
          recipientId: event.senderId,
          message: generatedReply.message,
          config,
        });
      }

      replyStatus = result?.ok ? "sent" : "failed";
      replyError = result?.error || "";
    } catch (error) {
      replyStatus = "failed";
      replyError = error.message;
    }

    markEventProcessed(event.id);
    markDmProcessed(event);
    addInstagramWebhookEvent({
      ...event,
      replyStatus,
      replyError,
      replyMessage: generatedReply.message,
      replySource: generatedReply.source,
      replyModel: generatedReply.model || "",
      aiError: generatedReply.error || "",
      graphResult: result,
    });
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

function getAutoReplySkipReason(event, config) {
  if (event.type === "message") {
    if (!event.id || !event.senderId || !normalizeText(event.text)) {
      return "DM without real text ignored.";
    }

    if (normalizeText(event.text) === normalizeText(config.dmReply)) {
      return "Own DM fallback reply ignored to prevent reply loops.";
    }

    return "";
  }

  if (event.type === "comment" && event.parentId) {
    return "Nested comment reply ignored to prevent reply loops.";
  }

  if (
    event.type === "comment" &&
    normalizeText(event.text) === normalizeText(config.commentReply)
  ) {
    return "Own auto-reply ignored to prevent reply loops.";
  }

  return "";
}

function getProcessedDmKeys() {
  if (!globalThis[processedDmKeys]) {
    globalThis[processedDmKeys] = new Map();
  }

  return globalThis[processedDmKeys];
}

function hasRecentlyProcessedDm(event) {
  if (event.type !== "message") {
    return false;
  }

  pruneProcessedDmKeys();
  return getProcessedDmKeys().has(getDmDedupeKey(event));
}

function markDmProcessed(event) {
  if (event.type !== "message") {
    return;
  }

  getProcessedDmKeys().set(getDmDedupeKey(event), Date.now());
}

function pruneProcessedDmKeys() {
  const now = Date.now();

  for (const [key, timestamp] of getProcessedDmKeys()) {
    if (now - timestamp > DM_DEDUPE_WINDOW_MS) {
      getProcessedDmKeys().delete(key);
    }
  }
}

function getDmDedupeKey(event) {
  return `${event.senderId || "unknown"}:${normalizeText(event.text)}`;
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}
