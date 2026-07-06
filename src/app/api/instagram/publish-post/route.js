import {
  getInstagramConfig,
  publishInstagramImagePost,
} from "@/app/lib/instagram";

export async function POST(request) {
  const config = getInstagramConfig();

  if (!config.accessToken) {
    return Response.json(
      { error: "Missing INSTAGRAM_ACCESS_TOKEN in .env.local." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const businessName = cleanText(body.businessName);
  const tagline = cleanText(body.tagline);
  const caption = cleanText(body.caption);

  if (!businessName) {
    return Response.json(
      { error: "Business name is required." },
      { status: 400 },
    );
  }

  const origin = getPublicOrigin(request);
  const originError = validatePublicOrigin(origin);

  if (originError) {
    return Response.json(
      {
        error: originError,
        code: "invalid_public_image_origin",
        origin: origin || "",
      },
      { status: 400 },
    );
  }

  const imageUrl = new URL("/api/instagram/generated-post-image", origin);
  imageUrl.searchParams.set("businessName", businessName);
  imageUrl.searchParams.set("tagline", tagline || "Now open for new customers");
  imageUrl.searchParams.set("v", Date.now().toString());

  const result = await publishInstagramImagePost({
    imageUrl: imageUrl.toString(),
    caption: caption || buildDefaultCaption(businessName),
    config,
  });

  if (!result.ok) {
    return Response.json(
      {
        error: result.error || "Instagram post publish failed.",
        result,
        imageUrl: imageUrl.toString(),
      },
      { status: result.status || 502 },
    );
  }

  return Response.json({
    ok: true,
    postId: result.data?.id || "",
    result,
    imageUrl: imageUrl.toString(),
  });
}

function getPublicOrigin(request) {
  if (process.env.INSTAGRAM_PUBLIC_BASE_URL) {
    return process.env.INSTAGRAM_PUBLIC_BASE_URL.trim().replace(/\/+$/, "");
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

function validatePublicOrigin(origin) {
  if (!origin) {
    return "Instagram needs a public HTTPS image URL. Set INSTAGRAM_PUBLIC_BASE_URL to your deployed HTTPS URL, then publish again.";
  }

  let url;

  try {
    url = new URL(origin);
  } catch {
    return "INSTAGRAM_PUBLIC_BASE_URL must be a valid public HTTPS URL.";
  }

  if (url.protocol !== "https:") {
    return "Instagram needs a public HTTPS image URL. Use your deployed Vercel URL or another HTTPS domain, then publish again.";
  }

  if (/^(localhost|127\.0\.0\.1)$/i.test(url.hostname)) {
    return "Instagram cannot fetch images from localhost. Open this page from your public HTTPS URL, then publish again.";
  }

  if (/\.ngrok-free\.app$/i.test(url.hostname)) {
    return "Instagram cannot reliably fetch images from free ngrok warning pages. Deploy this app to Vercel or use an ngrok domain without the browser warning, then set INSTAGRAM_PUBLIC_BASE_URL to that public URL.";
  }

  return "";
}

function buildDefaultCaption(businessName) {
  return `${businessName} is ready to serve you. Message us to know more.`;
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}
