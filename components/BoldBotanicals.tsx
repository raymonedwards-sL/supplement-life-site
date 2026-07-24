import { Fragment } from "react";
import { segmentText } from "@/lib/text/botanical-terms";

/**
 * Renders `text` with every Botanical Track name and ingredient name
 * (lib/text/botanical-terms.ts) wrapped in `<strong>` — drop this in
 * anywhere prose might mention a Track or ingredient by name (Sage's
 * chat, the LIFE Brief, the dashboard). Plain strings render unchanged
 * when nothing matches.
 */
export function boldBotanicals(text: string): React.ReactNode {
  const segments = segmentText(text);
  if (segments.length === 1 && !segments[0].bold) return text;
  return segments.map((seg, i) =>
    seg.bold ? (
      <strong key={i} className="font-bold">
        {seg.text}
      </strong>
    ) : (
      <Fragment key={i}>{seg.text}</Fragment>
    )
  );
}
