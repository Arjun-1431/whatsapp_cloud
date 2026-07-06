import crypto from "node:crypto";

const DEFAULT_GRAPH_VERSION = "v25.0";
const DEFAULT_COMMENT_REPLY =
  "Thanks for your comment. We will get back to you shortly.";
const DEFAULT_DM_REPLY =
  "Thanks for messaging us. We will get back to you shortly.";

export function getInstagramConfig(overrides = {}) {
  return {
    accessToken: overrides.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN || "",
    appSecret: overrides.appSecret || process.env.INSTAGRAM_APP_SECRET || "",
    verifyToken: overrides.verifyToken || process.env.INSTAGRAM_VERIFY_TOKEN || "",
    accountId: overrides.accountId || process.env.INSTAGRAM_ACCOUNT_ID || "",
    graphVersion:
      overrides.graphVersion ||
      process.env.INSTAGRAM_GRAPH_VERSION ||
      DEFAULT_GRAPH_VERSION,
    commentReply:
      overrides.commentReply ||
      process.env.INSTAGRAM_COMMENT_REPLY ||
      DEFAULT_COMMENT_REPLY,
    dmReply: overrides.dmReply || process.env.INSTAGRAM_DM_REPLY || DEFAULT_DM_REPLY,
    publishAccountId:
      overrides.publishAccountId ||
      process.env.INSTAGRAM_PUBLISH_ACCOUNT_ID ||
      process.env.INSTAGRAM_ACCOUNT_ID ||
      "",
  };
}

export function verifyMetaSignature({ rawBody, signatureHeader, appSecret }) {
  if (!appSecret) {
    return true;
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const actual = signatureHeader.slice("sha256=".length);

  return timingSafeEqualHex(actual, expected);
}

export function extractInstagramEvents(payload, accountId = "") {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const events = [];

  for (const entry of entries) {
    const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];

    for (const messaging of messagingEvents) {
      const senderId = messaging.sender?.id;
      const text = messaging.message?.text;
      const messageId = messaging.message?.mid;

      if (
        !senderId ||
        !messageId ||
        !text ||
        messaging.message?.is_echo ||
        senderId === accountId
      ) {
        continue;
      }

      events.push({
        type: "message",
        id: messageId,
        senderId,
        timestamp: messaging.timestamp || "",
        text,
      });
    }

    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change.value || {};
      const commentId = value.comment_id || value.id;
      const fromId = value.from?.id || value.user_id;
      const parentId = value.parent_id || value.parent?.id || "";

      if (!commentId || fromId === accountId || isDeletedComment(value)) {
        continue;
      }

      if (change.field === "comments" || value.media_id || value.comment_id) {
        events.push({
          type: "comment",
          id: commentId,
          commentId,
          fromId,
          parentId,
          text: value.text || value.message || "[comment received]",
        });
      }
    }
  }

  return events;
}

export async function replyToInstagramComment({ commentId, message, config }) {
  const endpoint = buildGraphUrl({
    graphVersion: config.graphVersion,
    path: `${commentId}/replies`,
    accessToken: config.accessToken,
  });

  return postForm(endpoint, { message });
}

export async function sendInstagramMessage({ recipientId, message, config }) {
  const endpoint = buildGraphUrl({
    graphVersion: config.graphVersion,
    path: "me/messages",
    accessToken: config.accessToken,
  });

  return postJson(endpoint, {
    recipient: { id: recipientId },
    message: { text: message },
  });
}

export async function publishInstagramImagePost({ imageUrl, caption, config }) {
  const publishAccountId = config.publishAccountId || config.accountId;

  if (!publishAccountId) {
    return {
      ok: false,
      status: 400,
      data: {},
      error: "Missing Instagram publish account ID.",
    };
  }

  const createContainer = await graphPostForm({
    config,
    host: "graph.facebook.com",
    path: `${publishAccountId}/media`,
    body: {
      image_url: imageUrl,
      caption,
    },
  });

  const creationId = createContainer.data?.id;

  if (!createContainer.ok || !creationId) {
    return {
      ...createContainer,
      step: "create_container",
    };
  }

  const publish = await graphPostForm({
    config,
    host: "graph.facebook.com",
    path: `${publishAccountId}/media_publish`,
    body: {
      creation_id: creationId,
    },
  });

  return {
    ...publish,
    step: publish.ok ? "published" : "publish",
    creationId,
  };
}

export function buildGraphUrl({ graphVersion, path, accessToken }) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  const url = new URL(
    `https://graph.instagram.com/${graphVersion}/${normalizedPath}`,
  );
  url.searchParams.set("access_token", accessToken);
  return url;
}

export async function fetchInstagramDashboard(config) {
  const [profile, conversations, media] = await Promise.all([
    graphGet({
      config,
      path: "me",
      params: {
        fields: "id,username,account_type,media_count",
      },
    }),
    graphGet({
      config,
      path: "me/conversations",
      params: {
        platform: "instagram",
        limit: "20",
        fields:
          "id,updated_time,participants,messages.limit(5){id,created_time,from,to,message}",
      },
    }),
    graphGet({
      config,
      path: "me/media",
      params: {
        limit: "20",
        fields:
          "id,caption,media_type,media_url,permalink,timestamp,comments_count,like_count",
      },
    }),
  ]);

  const postsWithoutComments = media.data?.data || [];
  const commentResults = await Promise.all(
    postsWithoutComments.map((post) =>
      graphGet({
        config,
        path: `${post.id}/comments`,
        params: {
          limit: "25",
          fields:
            "id,text,username,timestamp,replies.limit(5){id,text,username,timestamp}",
        },
      }),
    ),
  );
  const posts = postsWithoutComments.map((post, index) => ({
    ...post,
    comments: commentResults[index].data?.data || [],
    commentsError: commentResults[index].ok ? "" : commentResults[index].error,
  }));
  const chats = (conversations.data?.data || []).map((conversation) => ({
    ...conversation,
    messages: conversation.messages?.data || [],
  }));

  return {
    profile: profile.data || null,
    conversations: chats,
    posts,
    errors: {
      profile: profile.ok ? "" : profile.error,
      conversations: conversations.ok ? "" : conversations.error,
      posts: media.ok ? "" : media.error,
      comments: commentResults.find((result) => !result.ok)?.error || "",
    },
    totals: {
      conversations: chats.length,
      messages: chats.reduce((total, chat) => total + chat.messages.length, 0),
      posts: posts.length,
      comments: posts.reduce((total, post) => total + post.comments.length, 0),
    },
    fetchedAt: new Date().toISOString(),
  };
}

async function graphGet({ config, path, params = {} }) {
  const url = new URL(
    `https://graph.instagram.com/${config.graphVersion}/${String(path).replace(/^\/+/, "")}`,
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: data.error?.message || data.error?.error_user_msg || "",
  };
}

async function graphPostForm({
  config,
  path,
  body = {},
  host = "graph.instagram.com",
}) {
  const url = new URL(
    `https://${host}/${config.graphVersion}/${String(path).replace(/^\/+/, "")}`,
  );
  url.searchParams.set("access_token", config.accessToken);

  return postForm(url, body);
}

async function postForm(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });

  return readGraphResponse(response);
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return readGraphResponse(response);
}

async function readGraphResponse(response) {
  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: data.error?.message || data.error?.error_user_msg || "",
  };
}

function isDeletedComment(value) {
  return value.verb === "remove" || value.item === "comment_remove";
}

function timingSafeEqualHex(actual, expected) {
  try {
    const actualBuffer = Buffer.from(actual, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    return (
      actualBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}
