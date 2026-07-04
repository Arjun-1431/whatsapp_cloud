"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function WhatsAppConsole({ defaults }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const scrollerRef = useRef(null);

  const recipient = defaults.recipientPhoneNumber;
  const contactName = useMemo(() => `+${recipient}`, [recipient]);
  const lastMessage = messages.at(-1);

  useEffect(() => {
    let cancelled = false;

    function loadMessages() {
      getJson("/api/whatsapp/conversation")
        .then((data) => {
          if (!cancelled) {
            setMessages(data.messages || []);
            setError("");
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError("Could not load conversation.");
          }
        });
    }

    loadMessages();
    const interval = setInterval(loadMessages, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    const body = text.trim();

    if (!body || status === "sending") {
      return;
    }

    setStatus("sending");
    setError("");

    try {
      const data = await postJson("/api/whatsapp/messages", {
        to: recipient,
        mode: "text",
        text: body,
      });

      if (!data.ok) {
        setError(data.error || data.response?.error?.message || "Message could not be sent.");
        setStatus("error");
        return;
      }

      setMessages((current) => [...current, data.message].filter(Boolean));
      setText("");
      setStatus("sent");
    } catch (sendError) {
      setError(sendError.message);
      setStatus("error");
    }
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#111b21] text-[#e9edef]">
      <aside className="hidden w-[360px] shrink-0 border-r border-[#2a3942] bg-[#111b21] md:flex md:flex-col">
        <div className="flex h-16 items-center justify-between bg-[#202c33] px-4">
          <div className="flex items-center gap-3">
            <Avatar label="AI" />
            <div>
              <h1 className="text-sm font-semibold">WhatsApp Cloud API</h1>
              <p className="text-xs text-[#8696a0]">Dark conversation mode</p>
            </div>
          </div>
          <div className="flex gap-1 text-[#aebac1]">
            <IconButton label="Status" icon="o" />
            <IconButton label="New chat" icon="+" />
          </div>
        </div>

        <div className="border-b border-[#222e35] p-3">
          <div className="rounded-lg bg-[#202c33] px-4 py-2 text-sm text-[#8696a0]">
            Search or start new chat
          </div>
        </div>

        <button className="flex w-full items-center gap-3 bg-[#2a3942] px-4 py-3 text-left">
          <Avatar label="WA" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="truncate text-[15px] font-medium">{contactName}</h2>
              <span className="text-xs text-[#8696a0]">
                {lastMessage ? formatTime(lastMessage.timestamp) : ""}
              </span>
            </div>
            <p className="truncate text-sm text-[#aebac1]">
              {lastMessage?.text || "Send and receive messages here"}
            </p>
          </div>
        </button>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[#0b141a]">
        <header className="flex h-16 shrink-0 items-center justify-between bg-[#202c33] px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar label="WA" />
            <div className="min-w-0">
              <h2 className="truncate text-base font-medium">{contactName}</h2>
              <p className="truncate text-xs text-[#8696a0]">
                {defaults.hasServerToken ? "Connected through .env.local" : "Access token missing"}
              </p>
            </div>
          </div>
          <div className="flex text-[#aebac1]">
            <IconButton label="Search" icon="?" />
            <IconButton label="Menu" icon=":" />
          </div>
        </header>

        <div
          ref={scrollerRef}
          className="chat-bg flex-1 overflow-y-auto px-3 py-6 sm:px-8"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-2">
            <div className="mx-auto mb-4 max-w-sm rounded-lg bg-[#182229] px-4 py-2 text-center text-xs leading-5 text-[#8696a0]">
              Messages are sent with your WhatsApp test number. Incoming webhook messages will appear here automatically.
            </div>

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        {error ? (
          <div className="border-t border-[#3b2222] bg-[#2a1518] px-4 py-2 text-sm text-[#ffb4ab]">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={sendMessage}
          className="flex min-h-16 shrink-0 items-end gap-2 bg-[#202c33] px-3 py-3"
        >
          <IconButton label="Emoji" icon=":)" />
          <textarea
            className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border-0 bg-[#2a3942] px-4 py-3 text-[15px] leading-5 text-[#e9edef] outline-none placeholder:text-[#8696a0]"
            placeholder="Type a message"
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-lg font-semibold text-[#07130f] transition hover:bg-[#06cf9c] disabled:bg-[#2a3942] disabled:text-[#8696a0]"
            disabled={!text.trim() || status === "sending"}
            aria-label="Send message"
          >
            {status === "sending" ? "..." : ">"}
          </button>
        </form>
      </section>
    </main>
  );
}

function getJson(url) {
  return requestJson("GET", url);
}

function postJson(url, body) {
  return requestJson("POST", url, body);
}

function requestJson(method, url, body) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open(method, url, true);
    request.setRequestHeader("Accept", "application/json");

    if (body) {
      request.setRequestHeader("Content-Type", "application/json");
    }

    request.onload = () => {
      let data = {};

      try {
        data = request.responseText ? JSON.parse(request.responseText) : {};
      } catch {
        reject(new Error("Invalid JSON response."));
        return;
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(data);
        return;
      }

      reject(new Error(data.error || data.response?.error?.message || `Request failed (${request.status}).`));
    };

    request.onerror = () => reject(new Error("Network request failed."));
    request.ontimeout = () => reject(new Error("Network request timed out."));
    request.timeout = 15000;
    request.send(body ? JSON.stringify(body) : undefined);
  });
}

function MessageBubble({ message }) {
  const outgoing = message.direction === "outgoing";

  return (
    <article className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[66%] ${
          outgoing ? "rounded-tr-sm bg-[#005c4b]" : "rounded-tl-sm bg-[#202c33]"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[14.5px] leading-5 text-[#e9edef]">
          {message.text}
        </p>
        <div className="mt-1 flex justify-end gap-1 text-[11px] text-[#aebac1]">
          <span>{formatTime(message.timestamp)}</span>
          {outgoing ? <span>{message.status === "read" ? "vv" : "v"}</span> : null}
        </div>
      </div>
    </article>
  );
}

function Avatar({ label }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-sm font-bold text-[#06110e]">
      {label}
    </div>
  );
}

function IconButton({ label, icon }) {
  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-full text-xl transition hover:bg-[#2a3942]"
      type="button"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value || Date.now()));
}
