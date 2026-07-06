const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";

export function getNvidiaConfig(overrides = {}) {
  return {
    apiKey: overrides.apiKey || process.env.NVIDIA_API_KEY || "",
    baseUrl:
      overrides.baseUrl ||
      process.env.NVIDIA_BASE_URL ||
      DEFAULT_NVIDIA_BASE_URL,
    model: overrides.model || process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL,
  };
}

export async function generateInstagramAutoReply({
  event,
  fallbackMessage,
  nvidiaConfig = getNvidiaConfig(),
}) {
  if (!nvidiaConfig.apiKey) {
    return {
      message: fallbackMessage,
      source: "fallback",
      error: "Missing NVIDIA_API_KEY.",
    };
  }

  try {
    const response = await fetch(
      `${nvidiaConfig.baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${nvidiaConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: nvidiaConfig.model,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(event.type),
            },
            {
              role: "user",
              content: `Customer ${event.type}: ${event.text || "[no text]"}`,
            },
          ],
          temperature: 0.45,
          top_p: 0.9,
          max_tokens: event.type === "comment" ? 70 : 120,
        }),
        cache: "no-store",
      },
    );
    const data = await response.json().catch(() => ({}));
    const generatedMessage = cleanReply(
      data.choices?.[0]?.message?.content || "",
    );

    if (!response.ok || !generatedMessage) {
      return {
        message: fallbackMessage,
        source: "fallback",
        error:
          data.error?.message ||
          data.detail ||
          `NVIDIA API returned ${response.status}.`,
      };
    }

    return {
      message: generatedMessage,
      source: "nvidia",
      model: nvidiaConfig.model,
      error: "",
    };
  } catch (error) {
    return {
      message: fallbackMessage,
      source: "fallback",
      error: error.message,
    };
  }
}

function buildSystemPrompt(eventType) {
  const channelInstruction =
    eventType === "comment"
      ? "Write one public Instagram comment reply under 220 characters."
      : "Write one friendly Instagram DM reply under 500 characters.";

  return [
    "You write replies for an Instagram business account.",
    channelInstruction,
    "Reply in the same language and script the customer used. If they use Hinglish, reply in Hinglish.",
    "Respond according to the customer's behavior: thank praise, calm complaints, answer questions, and ask for details when needed.",
    "If the customer says they do not need help, acknowledge politely and do not ask repeated follow-up questions.",
    "Be warm, natural, and concise.",
    "Do not mention AI, NVIDIA, internal policy, or automation.",
    "Do not use hashtags, markdown, quotes, emojis, or multiple reply options.",
  ].join(" ");
}

function cleanReply(value) {
  return String(value || "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
