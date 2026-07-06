export const metadata = {
  title: "Data Deletion Instructions | test-application",
  description:
    "Instructions for requesting deletion of data associated with test-application.",
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            test-application
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            Data Deletion Instructions
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Last updated: July 6, 2026
          </p>
        </header>

        <div className="space-y-8 py-8 text-base leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              How to Request Data Deletion
            </h2>
            <p className="mt-3">
              If you want your data deleted from test-application, send an email
              to{" "}
              <a
                className="font-medium text-teal-700 underline underline-offset-4"
                href="mailto:padamsinghgwalior@gmail.com"
              >
                padamsinghgwalior@gmail.com
              </a>{" "}
              with the subject line &quot;Data Deletion Request&quot;.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Information to Include
            </h2>
            <p className="mt-3">
              Please include the name, email address, Facebook profile, Instagram
              account, Page, or business account connected with your request.
              This helps us identify the correct records and avoid deleting the
              wrong information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              What We Delete
            </h2>
            <p className="mt-3">
              After verifying the request, we will delete applicable information
              associated with your use of the app, including test account
              identifiers, conversation records, and other stored data connected
              to the app where deletion is permitted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Processing Time
            </h2>
            <p className="mt-3">
              We aim to process deletion requests within 30 days. If we need more
              information to verify your request, we will contact you using the
              email address you provide.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Data We May Retain
            </h2>
            <p className="mt-3">
              Some information may be retained when required by law, security,
              fraud prevention, dispute resolution, or platform compliance
              obligations. Any retained information will be limited to what is
              necessary for those purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Contact
            </h2>
            <p className="mt-3">
              For questions about data deletion, contact{" "}
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
