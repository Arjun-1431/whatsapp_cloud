export const metadata = {
  title: "Privacy Policy | test-application",
  description:
    "Privacy policy for test-application, including contact and data deletion instructions.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            test-application
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Last updated: July 6, 2026
          </p>
        </header>

        <div className="space-y-8 py-8 text-base leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Information We Collect
            </h2>
            <p className="mt-3">
              test-application may receive basic account information and message
              data that you choose to share through Meta, Instagram, or WhatsApp
              platform features connected to this app. This can include your
              public profile information, page or business account identifiers,
              messages sent to the connected business account, and technical
              information needed to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              How We Use Information
            </h2>
            <p className="mt-3">
              We use this information only to provide, test, and improve the app
              features, including receiving messages, displaying conversations,
              sending replies, and verifying that Meta platform integrations are
              working correctly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Sharing of Information
            </h2>
            <p className="mt-3">
              We do not sell personal information. We do not share personal
              information with third parties except when required to operate the
              app, comply with law, protect our rights, or follow Meta platform
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Data Retention
            </h2>
            <p className="mt-3">
              We keep information only for as long as needed to operate and test
              the app, meet legal obligations, resolve issues, and maintain
              security. Test data may be deleted when it is no longer needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Data Deletion
            </h2>
            <p className="mt-3">
              To request deletion of your information, email us at{" "}
              <a
                className="font-medium text-teal-700 underline underline-offset-4"
                href="mailto:padamsinghgwalior@gmail.com"
              >
                padamsinghgwalior@gmail.com
              </a>{" "}
              with the subject line &quot;Data Deletion Request&quot;. We will
              review and delete applicable data unless we are required to retain
              it by law or for security reasons.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Contact Us
            </h2>
            <p className="mt-3">
              If you have questions about this privacy policy or how your data is
              handled, contact us at{" "}
              <a
                className="font-medium text-teal-700 underline underline-offset-4"
                href="mailto:padamsinghgwalior@gmail.com"
              >
                padamsinghgwalior@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
