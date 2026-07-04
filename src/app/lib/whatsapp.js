const DEFAULT_GRAPH_VERSION = "v25.0";
const DEFAULT_PHONE_NUMBER_ID = "1183287854869934";
const DEFAULT_RECIPIENT_PHONE_NUMBER = "917354436777";

const templates = {
  hello_world: {
    name: "hello_world",
    language: "en_US",
    label: "Hello world",
    sample: "Sends Meta's default WhatsApp sandbox template.",
    parameters: [],
  },
  jaspers_market_plain_text_v1: {
    name: "jaspers_market_plain_text_v1",
    language: "en_US",
    label: "Plain text",
    sample: "Sends your approved plain text template.",
    parameters: [],
  },
  jaspers_market_order_confirmation_v1: {
    name: "jaspers_market_order_confirmation_v1",
    language: "en_US",
    label: "Order confirmation",
    sample: "Hi John Doe, your order 123456 is confirmed for Jul 3, 2026.",
    parameters: [
      { key: "customerName", label: "Customer name", defaultValue: "John Doe" },
      { key: "orderNumber", label: "Order number", defaultValue: "123456" },
      { key: "deliveryDate", label: "Delivery date", defaultValue: "Jul 3, 2026" },
    ],
  },
};

export const whatsappDefaults = {
  appId: "1378095757705634",
  businessAccountId: "1758917781765345",
  phoneNumber: "+1 (555) 081-9279",
  phoneNumberId: DEFAULT_PHONE_NUMBER_ID,
  graphVersion: DEFAULT_GRAPH_VERSION,
  recipientPhoneNumber: DEFAULT_RECIPIENT_PHONE_NUMBER,
  templates,
};

export function normalizePhoneNumber(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export function getWhatsAppConfig(overrides = {}) {
  return {
    accessToken: overrides.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId:
      overrides.phoneNumberId ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      DEFAULT_PHONE_NUMBER_ID,
    graphVersion:
      overrides.graphVersion ||
      process.env.WHATSAPP_GRAPH_VERSION ||
      DEFAULT_GRAPH_VERSION,
  };
}

export function buildTemplateMessage({ to, templateName, languageCode, parameters }) {
  const template = templates[templateName];

  if (!template) {
    throw new Error("Unsupported WhatsApp template.");
  }

  const bodyParameters = template.parameters.map((parameter) => ({
    type: "text",
    text: String(parameters?.[parameter.key] || parameter.defaultValue || ""),
  }));

  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: languageCode || template.language },
      ...(bodyParameters.length
        ? {
            components: [
              {
                type: "body",
                parameters: bodyParameters,
              },
            ],
          }
        : {}),
    },
  };
}

export function buildTextMessage({ to, text }) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: true,
      body: String(text || ""),
    },
  };
}
