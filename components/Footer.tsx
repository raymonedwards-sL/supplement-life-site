export default function Footer() {
  return (
    <footer className="border-t border-navy/10 bg-cream">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-navy/60">
        &copy; {new Date().getFullYear()} Your Life Protocol. All rights reserved.
      </div>
    </footer>
  );
}
