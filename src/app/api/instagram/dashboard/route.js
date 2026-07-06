import {
  fetchInstagramDashboard,
  getInstagramConfig,
} from "@/app/lib/instagram";
import { getInstagramWebhookEvents } from "@/app/lib/instagram-event-store";

export async function GET() {
  const config = getInstagramConfig();

  if (!config.accessToken) {
    return Response.json(
      { error: "Missing INSTAGRAM_ACCESS_TOKEN in .env.local." },
      { status: 400 },
    );
  }

  try {
    const dashboard = await fetchInstagramDashboard(config);
    return Response.json({
      ...dashboard,
      webhookEvents: getInstagramWebhookEvents(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not load Instagram dashboard.",
        detail: error.message,
        webhookEvents: getInstagramWebhookEvents(),
      },
      { status: 502 },
    );
  }
}
