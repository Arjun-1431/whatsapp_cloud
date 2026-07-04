import {
  buildTemplateMessage,
  buildTextMessage,
  getWhatsAppConfig,
  normalizePhoneNumber,
} from "@/app/lib/whatsapp";
import { addMessage } from "@/app/lib/conversation-store";

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const to = normalizePhoneNumber(body.to);

  if (!to) {
    return Response.json({ error: "Recipient phone number is required." }, { status: 400 });
  }

  const config = getWhatsAppConfig({
    accessToken: body.accessToken,
    phoneNumberId: body.phoneNumberId,
    graphVersion: body.graphVersion,
  });

  if (!config.accessToken) {
    return Response.json(
      {
        error:
          "Missing WhatsApp access token. Add WHATSAPP_ACCESS_TOKEN to .env.local or paste a temporary token in the test console.",
      },
      { status: 400 },
    );
  }

  let message;

  try {
    message =
      body.mode === "text"
        ? buildTextMessage({ to, text: body.text })
        : buildTemplateMessage({
            to,
            templateName: body.templateName,
            languageCode: body.languageCode,
            parameters: body.parameters,
          });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (message.type === "text" && !message.text.body.trim()) {
    return Response.json({ error: "Text message cannot be empty." }, { status: 400 });
  }

  const endpoint = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    const graphError = data.error?.message || data.error?.error_user_msg || "";
    const error =
      !response.ok && data.error?.code === 190
        ? "WhatsApp access token expired or invalid. Generate a new token in Meta and update WHATSAPP_ACCESS_TOKEN in .env.local, then restart the dev server."
        : graphError;

    const sentMessage =
      response.ok &&
      addMessage({
        id: data.messages?.[0]?.id,
        direction: "outgoing",
        text:
          message.type === "text"
            ? message.text.body
            : body.templateLabel || message.template.name,
        status: "sent",
        to,
      });

    return Response.json(
      {
        ok: response.ok,
        error,
        response: data,
        message: sentMessage || null,
      },
      { status: response.ok ? 200 : response.status },
    );
  } catch (error) {
    return Response.json(
      { error: "Could not reach WhatsApp Graph API.", detail: error.message },
      { status: 502 },
    );
  }
}
