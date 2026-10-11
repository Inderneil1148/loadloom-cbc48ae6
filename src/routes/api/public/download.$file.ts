import { createFileRoute } from "@tanstack/react-router";

// Fixed allow-list: only these app files can be downloaded.
const FILES = new Set([
  "LoadLoom-universal.dmg",
  "LoadLoom-windows.zip",
  "LoadLoom.apk",
]);

export const Route = createFileRoute("/api/public/download/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!FILES.has(params.file)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("app-downloads")
          .createSignedUrl(params.file, 60 * 10, { download: params.file });
        if (error || !data) {
          // File not uploaded yet: send the visitor back to the download page with a friendly notice.
          return new Response(null, {
            status: 302,
            headers: { Location: `/download?unavailable=${encodeURIComponent(params.file)}`, "Cache-Control": "no-store" },
          });
        }
        return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "no-store" } });
      },
    },
  },
});
