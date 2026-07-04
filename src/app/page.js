import WhatsAppConsole from "@/app/components/WhatsAppConsole";
import { whatsappDefaults } from "@/app/lib/whatsapp";

export default function Home() {
  return (
    <WhatsAppConsole
      defaults={{
        ...whatsappDefaults,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || whatsappDefaults.phoneNumberId,
        recipientPhoneNumber:
          process.env.WHATSAPP_RECIPIENT_PHONE_NUMBER ||
          whatsappDefaults.recipientPhoneNumber,
        hasServerToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      }}
    />
  );
}
