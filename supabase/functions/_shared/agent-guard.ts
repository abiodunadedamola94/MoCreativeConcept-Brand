import { createClient } from "jsr:@supabase/supabase-js@2";

// Agents run only when called with the secret pg_cron sends (x-agent-secret,
// kept in Supabase Vault and checked by public.agent_secret_ok). The public
// anon key alone is refused, so nobody outside the database can trigger a
// run, an email send or a paid API call.
export async function refuseUnlessAgentCall(req: Request): Promise<Response | null> {
  const secret = req.headers.get("x-agent-secret") ?? "";
  if (secret) {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await supabase.rpc("agent_secret_ok", { s: secret });
    if (data === true) return null;
  }
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
