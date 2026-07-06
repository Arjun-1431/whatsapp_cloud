import InstagramDashboard from "@/app/components/InstagramDashboard";
import { getInstagramConfig } from "@/app/lib/instagram";

export default function Home() {
  const instagramConfig = getInstagramConfig();

  return (
    <InstagramDashboard
      defaults={{
        accountId: instagramConfig.accountId,
        hasServerToken: Boolean(instagramConfig.accessToken),
      }}
    />
  );
}
