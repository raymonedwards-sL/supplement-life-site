export default function AuthError() {
  return (
    <section className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Link expired
      </h1>
      <p className="mt-4 text-navy/70">
        That login link is no longer valid — it may have already been used
        or expired. Reserve again or contact us to get a fresh link sent to
        your email.
      </p>
    </section>
  );
}
