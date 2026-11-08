import { createFileRoute } from "@tanstack/react-router";

// Same-origin proxy to the ltser API (was the Vite/nginx proxy). Without LTSER_API_URL it answers 502,
// and the app falls back to its demo data, exactly as before.
async function proxy({ request }: { request: Request }) {
  const target = process.env.LTSER_API_URL;
  if (!target) return Response.json({ detail: "LTSER_API_URL is not configured" }, { status: 502 });
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/ltser-api/, "") || "/";
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  try {
    const res = await fetch(target.replace(/\/+$/, "") + rest + url.search, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    });
    return new Response(res.body, { status: res.status, headers: res.headers });
  } catch (error) {
    return Response.json({ detail: `Upstream unreachable: ${(error as Error).message}` }, { status: 502 });
  }
}

export const Route = createFileRoute("/ltser-api/$")({
  server: { handlers: { GET: proxy, POST: proxy, HEAD: proxy } },
});
