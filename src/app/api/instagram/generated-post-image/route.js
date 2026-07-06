import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const businessName = cleanBusinessName(searchParams.get("businessName"));
  const tagline =
    cleanText(searchParams.get("tagline")) ||
    "Now open for new customers";
  const theme = getTheme(businessName);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: theme.background,
          color: "#f8fafc",
          padding: 72,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          <span>{businessName}</span>
          <span
            style={{
              border: "3px solid rgba(255,255,255,0.7)",
              borderRadius: 999,
              padding: "12px 24px",
            }}
          >
            NEW
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              width: 160,
              height: 12,
              background: theme.accent,
              borderRadius: 999,
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: fitFontSize(businessName),
              lineHeight: 0.95,
              fontWeight: 900,
              letterSpacing: 0,
              maxWidth: 900,
            }}
          >
            {businessName}
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 760,
              color: "rgba(248,250,252,0.88)",
              fontSize: 46,
              lineHeight: 1.15,
              fontWeight: 600,
            }}
          >
            {tagline}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "3px solid rgba(255,255,255,0.22)",
            paddingTop: 28,
            fontSize: 28,
            color: "rgba(248,250,252,0.82)",
          }}
        >
          <span>Follow us on Instagram</span>
          <span>{theme.footer}</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    },
  );
}

function cleanBusinessName(value) {
  const name = cleanText(value);
  return name ? name.slice(0, 60) : "Your Business";
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function fitFontSize(value) {
  const length = String(value || "").length;

  if (length > 36) {
    return 86;
  }

  if (length > 24) {
    return 104;
  }

  return 124;
}

function getTheme(value) {
  const themes = [
    {
      background:
        "linear-gradient(135deg, #0f172a 0%, #155e75 48%, #134e4a 100%)",
      accent: "#67e8f9",
      footer: "Fresh updates daily",
    },
    {
      background:
        "linear-gradient(135deg, #111827 0%, #7c2d12 46%, #be123c 100%)",
      accent: "#fb7185",
      footer: "Quality you can trust",
    },
    {
      background:
        "linear-gradient(135deg, #0c0a09 0%, #365314 48%, #047857 100%)",
      accent: "#bef264",
      footer: "Made for you",
    },
  ];
  const index =
    Array.from(String(value || "")).reduce(
      (total, char) => total + char.charCodeAt(0),
      0,
    ) % themes.length;

  return themes[index];
}
