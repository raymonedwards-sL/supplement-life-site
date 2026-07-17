import { Container, Eyebrow } from "@/components/ui/Container";
import FaqAccordion from "@/components/FaqAccordion";
import { FAQS as faqs } from "@/lib/faq-content";

export default function FAQ() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <Eyebrow>FAQ</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-navy/70">
          Everything about the intake, billing, and what&apos;s actually in
          your protocol.
        </p>

        <div className="mt-10">
          <FaqAccordion faqs={faqs} />
        </div>

        <p className="mt-10 text-sm text-navy/50">
          Still have a question?{" "}
          <a
            href="mailto:hello@yourlifeprotocol.com"
            className="font-semibold text-copper hover:text-copper/80"
          >
            Email us
          </a>
          .
        </p>
      </Container>
    </section>
  );
}
