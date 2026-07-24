import Image from "next/image";

function initialsFrom(fullName: string, email: string): string {
  const source = fullName.trim() || email;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Circular subscriber-photo overlay for the LIFE Brief report, positioned
 * as a top-left corner overlap on the report's opening section — same
 * absolute-positioned overlap pattern as Sage's avatar in
 * app/intake/IntakeChat.tsx. Falls back to initials when no photo has
 * been uploaded yet (see components/AvatarUpload.tsx, which shares this
 * initialsFrom() logic — duplicated rather than imported since these two
 * components have no other shared dependency).
 */
export function ProfileAvatar({
  avatarUrl,
  fullName,
  email,
}: {
  avatarUrl: string | null;
  fullName: string;
  email: string;
}) {
  return (
    <div className="absolute -top-6 -left-3 z-10 h-16 w-16 overflow-hidden rounded-full border-4 border-cream shadow-lg sm:-top-8 sm:-left-4 sm:h-20 sm:w-20">
      {avatarUrl ? (
        <Image src={avatarUrl} alt="Your profile photo" fill sizes="80px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-navy/5 text-sm font-semibold text-navy/50">
          {initialsFrom(fullName, email)}
        </span>
      )}
    </div>
  );
}
