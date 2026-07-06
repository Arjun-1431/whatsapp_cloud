"use client";

import { useEffect, useMemo, useState } from "react";

export default function InstagramDashboard({ defaults }) {
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("webhooks");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/instagram/dashboard", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not load Instagram data.");
      }

      setDashboard(data);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError.message);
      setStatus("error");
    }
  }

  const conversations = useMemo(
    () => dashboard?.conversations || [],
    [dashboard?.conversations],
  );
  const posts = useMemo(() => dashboard?.posts || [], [dashboard?.posts]);
  const webhookEvents = useMemo(
    () => dashboard?.webhookEvents || [],
    [dashboard?.webhookEvents],
  );
  const recentComments = useMemo(
    () =>
      posts.flatMap((post) =>
        (post.comments || []).map((comment) => ({
          ...comment,
          postId: post.id,
          postCaption: post.caption || "Untitled post",
          postPermalink: post.permalink,
        })),
      ),
    [posts],
  );

  return (
    <main className="min-h-screen bg-[#0f1419] text-[#eef2f5]">
      <header className="border-b border-[#26313d] bg-[#151b22] px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9aa7b4]">
              Instagram API
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              @{dashboard?.profile?.username || "test1236799"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill active={defaults.hasServerToken} label="Token" />
            <StatusPill active={Boolean(defaults.accountId)} label="Account" />
            <button
              className="rounded-md border border-[#394756] px-4 py-2 text-sm font-medium text-[#dfe6ee] transition hover:bg-[#202a35]"
              onClick={loadDashboard}
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 md:grid-cols-5">
        <Metric label="Conversations" value={dashboard?.totals?.conversations || 0} />
        <Metric label="Loaded messages" value={dashboard?.totals?.messages || 0} />
        <Metric label="Posts" value={dashboard?.totals?.posts || 0} />
        <Metric label="Loaded comments" value={dashboard?.totals?.comments || 0} />
        <Metric label="Webhook events" value={webhookEvents.length} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        {error ? <Notice tone="error" text={error} /> : null}
        {status === "loading" ? <Notice text="Loading Instagram data..." /> : null}
        <ApiErrors errors={dashboard?.errors} />

        <div className="mb-4 flex border-b border-[#26313d]">
          <TabButton active={activeTab === "webhooks"} onClick={() => setActiveTab("webhooks")}>
            Webhook Inbox
          </TabButton>
          <TabButton active={activeTab === "messages"} onClick={() => setActiveTab("messages")}>
            DMs
          </TabButton>
          <TabButton active={activeTab === "comments"} onClick={() => setActiveTab("comments")}>
            Comments
          </TabButton>
          <TabButton active={activeTab === "posts"} onClick={() => setActiveTab("posts")}>
            Posts
          </TabButton>
        </div>

        {activeTab === "webhooks" ? (
          <WebhookEventList events={webhookEvents} />
        ) : null}
        {activeTab === "messages" ? (
          <ConversationList conversations={conversations} />
        ) : null}
        {activeTab === "comments" ? <CommentList comments={recentComments} /> : null}
        {activeTab === "posts" ? <PostList posts={posts} /> : null}
      </section>
    </main>
  );
}

function WebhookEventList({ events }) {
  if (!events.length) {
    return (
      <EmptyState text="No webhook DM or comment received yet. Send an Instagram DM or comment after webhook subscription is active, then press Refresh." />
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <article
          className="rounded-md border border-[#26313d] bg-[#151b22] p-4"
          key={`${event.id}-${event.receivedAt}`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#20314a] px-3 py-1 text-xs font-semibold uppercase text-[#9db7ff]">
                {event.type === "message" ? "DM" : "Comment"}
              </span>
              <ReplyStatus status={event.replyStatus} />
            </div>
            <span className="text-xs text-[#9aa7b4]">
              {formatDate(event.receivedAt)}
            </span>
          </div>

          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa7b4]">
                From
              </dt>
              <dd className="mt-1 break-words text-[#eef2f5]">
                {event.senderId || event.fromId || "Instagram user"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa7b4]">
                Event ID
              </dt>
              <dd className="mt-1 break-words text-[#eef2f5]">{event.id}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-md bg-[#202a35] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa7b4]">
              Incoming
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-[#eef2f5]">
              {event.text || "[No text]"}
            </p>
          </div>

          {event.replyMessage ? (
            <div className="mt-3 rounded-md bg-[#13251f] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7ef0b2]">
                  Auto reply
                </p>
                {event.replySource ? (
                  <span className="rounded-full bg-[#1d3b32] px-2 py-1 text-[11px] font-semibold uppercase text-[#9cf7c4]">
                    {event.replySource}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 break-words text-sm leading-6 text-[#e7fff1]">
                {event.replyMessage}
              </p>
              {event.replyModel ? (
                <p className="mt-2 text-xs text-[#8fbaa5]">{event.replyModel}</p>
              ) : null}
            </div>
          ) : null}

          {event.aiError ? (
            <p className="mt-3 rounded-md bg-[#3a3420] px-3 py-2 text-sm leading-6 text-[#ffe08a]">
              AI fallback: {event.aiError}
            </p>
          ) : null}

          {event.replyError ? (
            <p className="mt-3 rounded-md bg-[#29171b] px-3 py-2 text-sm leading-6 text-[#ffb4ab]">
              {event.replyError}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ReplyStatus({ status }) {
  const styles = {
    sent: "bg-[#123c2d] text-[#7ef0b2]",
    failed: "bg-[#3a2024] text-[#ffb4ab]",
    skipped: "bg-[#3a3420] text-[#ffe08a]",
    ignored: "bg-[#202a35] text-[#c4d7ea]",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.ignored
      }`}
    >
      Reply: {status || "pending"}
    </span>
  );
}

function StatusPill({ active, label }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-[#123c2d] text-[#7ef0b2]" : "bg-[#3a2024] text-[#ffb4ab]"
      }`}
    >
      {label}: {active ? "OK" : "Missing"}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <article className="rounded-md border border-[#26313d] bg-[#151b22] p-4">
      <p className="text-sm text-[#9aa7b4]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </article>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-[#7c9cff] text-white"
          : "border-transparent text-[#9aa7b4] hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ApiErrors({ errors }) {
  const entries = Object.entries(errors || {}).filter(([, value]) => value);

  if (!entries.length) {
    return null;
  }

  return (
    <div className="mb-4 grid gap-2">
      {entries.map(([key, value]) => (
        <Notice key={key} tone="error" text={`${key}: ${value}`} />
      ))}
    </div>
  );
}

function Notice({ tone = "info", text }) {
  return (
    <div
      className={`mb-4 rounded-md border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-[#67333a] bg-[#29171b] text-[#ffb4ab]"
          : "border-[#2f4052] bg-[#172230] text-[#c4d7ea]"
      }`}
    >
      {text}
    </div>
  );
}

function ConversationList({ conversations }) {
  if (!conversations.length) {
    return <EmptyState text="No conversations returned by the Instagram API." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {conversations.map((conversation) => (
        <article
          className="rounded-md border border-[#26313d] bg-[#151b22] p-4"
          key={conversation.id}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="truncate text-sm font-semibold text-white">
              Conversation {shortId(conversation.id)}
            </h2>
            <span className="text-xs text-[#9aa7b4]">
              {formatDate(conversation.updated_time)}
            </span>
          </div>
          <div className="grid gap-2">
            {(conversation.messages || []).map((message) => (
              <div className="rounded-md bg-[#202a35] px-3 py-2" key={message.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#9aa7b4]">
                  <span>{message.from?.username || shortId(message.from?.id) || "User"}</span>
                  <span>{formatDate(message.created_time)}</span>
                </div>
                <p className="break-words text-sm leading-5 text-[#eef2f5]">
                  {message.message || "[media or unsupported message]"}
                </p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function CommentList({ comments }) {
  if (!comments.length) {
    return <EmptyState text="No comment text returned by the Instagram API. Post comment counts still appear in the Posts tab." />;
  }

  return (
    <div className="grid gap-3">
      {comments.map((comment) => (
        <article
          className="rounded-md border border-[#26313d] bg-[#151b22] p-4"
          key={comment.id}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">
              @{comment.username || "instagram_user"}
            </span>
            <span className="text-xs text-[#9aa7b4]">{formatDate(comment.timestamp)}</span>
          </div>
          <p className="break-words text-sm leading-6 text-[#eef2f5]">{comment.text}</p>
          <a
            className="mt-3 block truncate text-xs font-medium text-[#9db7ff] hover:text-white"
            href={comment.postPermalink}
            rel="noreferrer"
            target="_blank"
          >
            {comment.postCaption}
          </a>
        </article>
      ))}
    </div>
  );
}

function PostList({ posts }) {
  if (!posts.length) {
    return <EmptyState text="No posts returned by the Instagram API." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <article
          className="overflow-hidden rounded-md border border-[#26313d] bg-[#151b22]"
          key={post.id}
        >
          {post.media_type === "IMAGE" && post.media_url ? (
            <div
              aria-label={post.caption || "Instagram post"}
              className="aspect-square w-full bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${post.media_url}")` }}
            />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-[#202a35] text-sm text-[#9aa7b4]">
              {post.media_type || "MEDIA"}
            </div>
          )}
          <div className="p-4">
            <p className="line-clamp-3 text-sm leading-6 text-[#eef2f5]">
              {post.caption || "No caption"}
            </p>
            <div className="mt-3 flex justify-between text-xs text-[#9aa7b4]">
              <span>{post.comments_count || 0} comments</span>
              <span>{post.like_count || 0} likes</span>
            </div>
            {post.comments_count > 0 && !post.comments?.length ? (
              <p className="mt-3 rounded-md bg-[#202a35] px-3 py-2 text-xs leading-5 text-[#c4d7ea]">
                Comment text not returned by API for this token/app mode.
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-md border border-dashed border-[#394756] bg-[#151b22] px-4 py-10 text-center text-sm text-[#9aa7b4]">
      {text}
    </div>
  );
}

function shortId(value) {
  const id = String(value || "");
  return id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
