"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function initialsFrom(fullName: string, email: string): string {
  const source = fullName.trim() || email;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Self-service profile-photo upload, same "browser client, direct table
 * update" pattern as the rest of AccountSettings.tsx. Stored in the public
 * "avatars" Supabase Storage bucket at a fixed per-user path (no
 * extension) so re-uploads overwrite the same object via upsert rather
 * than accumulating orphaned files — see
 * supabase/migrations/0017_avatar_upload.sql for the bucket + RLS setup.
 *
 * The uploaded photo also surfaces as a circular overlay on the
 * subscriber's LIFE Brief report (app/dashboard/brief/page.tsx +
 * components/life-brief/ProfileAvatar.tsx) — this component and that one
 * share the initialsFrom() fallback logic (duplicated, not imported,
 * since one is a small pure function and the two components have no
 * other shared dependency).
 */
export default function AvatarUpload({
  userId,
  initialAvatarUrl,
  fullName,
  email,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  fullName: string;
  email: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file again later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setError("Image must be under 5MB.");
      return;
    }

    setStatus("uploading");
    setError(null);

    const supabase = createClient();
    const path = `${userId}/avatar`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setStatus("error");
      setError("Upload failed — try again.");
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust: the path never changes on re-upload, so without this the
    // browser/CDN would keep showing the old cached image at the same URL.
    const bustedUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("users")
      .update({ avatar_url: bustedUrl })
      .eq("id", userId);

    if (dbError) {
      setStatus("error");
      setError("Photo uploaded, but couldn't save it to your profile — try again.");
      return;
    }

    setAvatarUrl(bustedUrl);
    setStatus("idle");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <label className="text-sm font-medium text-navy">Profile photo</label>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-navy/20 bg-navy/5">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Your profile photo" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-navy/50">
              {initialsFrom(fullName, email)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="self-start rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5 disabled:opacity-60"
          >
            {status === "uploading" ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {status === "error" && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-navy/40">This also appears on your LIFE Brief report.</p>
        </div>
      </div>
    </div>
  );
}
