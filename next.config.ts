import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Subscriber-uploaded avatars live in Supabase Storage (public
        // "avatars" bucket — see supabase/migrations/0017_avatar_upload.sql
        // and components/AvatarUpload.tsx). next/image refuses to render
        // any remote host that isn't explicitly allow-listed here.
        protocol: "https",
        hostname: "plkjrpjpnvaijuasrksf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
