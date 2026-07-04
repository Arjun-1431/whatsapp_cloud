import { getMessages } from "@/app/lib/conversation-store";

export async function GET() {
  return Response.json({ messages: getMessages() });
}
