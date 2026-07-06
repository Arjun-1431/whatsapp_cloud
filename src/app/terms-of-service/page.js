export const metadata = {
  title: "Terms of Service | test-application",
  description:
    "Terms of service for test-application and its Meta platform integrations.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            test-application
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Last updated: July 6, 2026
          </p>
        </header>

        <div className="space-y-8 py-8 text-base leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Acceptance of Terms
            </h2>
            <p className="mt-3">
              By accessing or using test-application, you agree to these Terms
              of Service. If you do not agree with these terms, please do not use
              the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Use of the App
            </h2>
            <p className="mt-3">
              test-application is provided to test and operate integrations with
              Meta, Instagram, and WhatsApp platform features. You agree to use
              the app only for lawful purposes and in compliance with applicable
              platform policies, laws, and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Account and Platform Access
            </h2>
            <p className="mt-3">
              Some features may require access to Meta platform accounts,
              business assets, pages, Instagram accounts, or WhatsApp business
              accounts. You are responsible for ensuring that you have permission
              to connect and use those assets with this app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Prohibited Conduct
            </h2>
            <p className="mt-3">
              You must not misuse the app, attempt unauthorized access, interfere
              with the app&apos;s operation, send spam or harmful content, or use
              the app in a way that violates Meta platform rules or applicable
              law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Privacy
            </h2>
            <p className="mt-3">
              Our handling of personal information is described in our{" "}
              <a
                className="font-medium text-teal-700 underline underline-offset-4"
                href="/privacy-policy"
              >
                Privacy Policy
              </a>
              . By using the app, you acknowledge that you have reviewed the
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              No Warranty
            </h2>
            <p className="mt-3">
              The app is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. We do not guarantee that the app will be
              uninterrupted, error-free, or suitable for every purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Changes to These Terms
            </h2>
            <p className="mt-3">
              We may update these terms from time to time. Updates will be
              posted on this page with a revised last updated date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Contact Us
            </h2>
            <p className="mt-3">
              If you have questions about these terms, contact us at{" "}
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
