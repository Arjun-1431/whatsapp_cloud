"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

export default function InstagramPostCreator() {
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("Now open for new customers");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [publishedPostId, setPublishedPostId] = useState("");

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({
      businessName: businessName || "Your Business",
      tagline: tagline || "Now open for new customers",
    });

    return `/api/instagram/generated-post-image?${params.toString()}`;
  }, [businessName, tagline]);

  const finalCaption =
    caption.trim() ||
    `${businessName || "Your Business"} is ready to serve you. Message us to know more.`;

  async function publishPost(event) {
    event.preventDefault();
    setStatus("publishing");
    setMessage("");
    setPublishedPostId("");

    try {
      const response = await fetch("/api/instagram/publish-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          businessName,
          tagline,
          caption: finalCaption,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(formatPublishError(data));
      }

      setPublishedPostId(data.postId || "");
      setMessage("Instagram post published successfully.");
      setStatus("published");
    } catch (error) {
      setMessage(error.message);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#101418] text-[#eef2f5]">
      <header className="border-b border-[#26313d] bg-[#151b22] px-5 py-4">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9aa7b4]">
            Instagram Publisher
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Create Business Post
          </h1>
        </div>
      </header>

      <form
        className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[0.9fr_1.1fr]"
        onSubmit={publishPost}
      >
        <section className="rounded-md border border-[#26313d] bg-[#151b22] p-5">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#dfe6ee]">
                Business name
              </span>
              <input
                className="rounded-md border border-[#394756] bg-[#0f1419] px-4 py-3 text-white outline-none transition focus:border-[#7c9cff] focus:ring-2 focus:ring-[#7c9cff]/20"
                maxLength={60}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="BharatApp"
                type="text"
                value={businessName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#dfe6ee]">
                Image tagline
              </span>
              <input
                className="rounded-md border border-[#394756] bg-[#0f1419] px-4 py-3 text-white outline-none transition focus:border-[#7c9cff] focus:ring-2 focus:ring-[#7c9cff]/20"
                maxLength={90}
                onChange={(event) => setTagline(event.target.value)}
                type="text"
                value={tagline}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#dfe6ee]">
                Caption
              </span>
              <textarea
                className="min-h-36 resize-y rounded-md border border-[#394756] bg-[#0f1419] px-4 py-3 text-white outline-none transition focus:border-[#7c9cff] focus:ring-2 focus:ring-[#7c9cff]/20"
                maxLength={2200}
                onChange={(event) => setCaption(event.target.value)}
                value={caption}
              />
              <span className="text-xs text-[#9aa7b4]">
                {finalCaption.length}/2200
              </span>
            </label>

            {message ? (
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  status === "error"
                    ? "border-[#67333a] bg-[#29171b] text-[#ffb4ab]"
                    : "border-[#26523f] bg-[#13251f] text-[#9cf7c4]"
                }`}
              >
                {message}
                {publishedPostId ? (
                  <span className="mt-1 block text-xs opacity-80">
                    Post ID: {publishedPostId}
                  </span>
                ) : null}
              </div>
            ) : null}

            <button
              className="rounded-md bg-[#7c9cff] px-5 py-3 text-sm font-bold text-[#08111f] transition hover:bg-[#9db7ff] disabled:cursor-not-allowed disabled:bg-[#394756] disabled:text-[#9aa7b4]"
              disabled={!businessName.trim() || status === "publishing"}
              type="submit"
            >
              {status === "publishing" ? "Publishing..." : "Post to Instagram"}
            </button>
          </div>
        </section>

        <section className="rounded-md border border-[#26313d] bg-[#151b22] p-5">
          <div className="overflow-hidden rounded-md border border-[#26313d] bg-[#0f1419]">
            <Image
              alt="Generated Instagram post preview"
              className="aspect-square w-full object-cover"
              height={1080}
              loading="eager"
              src={previewUrl}
              unoptimized
              width={1080}
            />
          </div>
          <div className="mt-4 rounded-md bg-[#202a35] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa7b4]">
              Caption Preview
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#eef2f5]">
              {finalCaption}
            </p>
          </div>
        </section>
      </form>
    </main>
  );
}

function formatPublishError(data) {
  const parts = [data.error || "Post publish failed."];

  if (data.origin) {
    parts.push(`Configured URL: ${data.origin}`);
  }

  if (data.imageUrl) {
    parts.push(`Image URL: ${data.imageUrl}`);
  }

  return parts.join("\n");
}
