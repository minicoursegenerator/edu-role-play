// edu-role-play Workers AI proxy.
//
// Accepts POST /ai/run/<model> from any origin, forwards to the Cloudflare
// Workers AI REST endpoint using the token held as a wrangler secret, and
// returns the response with CORS headers attached.
//
// Never logs request bodies — they contain learner transcripts.

interface Env {
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  RL: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(status: number, body: unknown): Response {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/ai\/run\/(.+)$/);
    if (request.method !== "POST" || !match) {
      return json(404, { error: "not found" });
    }
    const model = match[1];

    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const rl = await env.RL.limit({ key: ip });
    if (!rl.success) {
      return json(429, { error: "rate limit exceeded, try again shortly" });
    }

    if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
      return json(500, { error: "proxy not configured (missing secrets)" });
    }

    const upstream = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/${model}`;
    const body = await request.text();

    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body,
    });

    return withCors(res);
  },
};
