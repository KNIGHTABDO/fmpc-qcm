// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const { verifyAdmin: _verify } = await import("@/lib/admin");
  return _verify(req);
}

// GET: show bad cache count + today usage summary
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getServiceSupabase();
  const today = new Date().toISOString().split("T")[0];

  const [{ count: badCount }, { data: usageToday }] = await Promise.all([
    sb.from("ai_explanations").select("*", { count: "exact", head: true }).eq("explanation", "[]"),
    sb.from("ai_usage").select("user_id, multiplier, count").eq("usage_date", today),
  ]);

  return NextResponse.json({ bad_cache_count: badCount ?? 0, usage_today: usageToday ?? [] });
}

// POST ?action=purge_bad_cache  -- deletes ai_explanations with explanation='[]'
// POST ?action=reset_quota&userId=xxx  -- deletes today's ai_usage for a user
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const sb = getServiceSupabase();

  if (action === "purge_bad_cache") {
    const { error, count } = await sb
      .from("ai_explanations")
      .delete({ count: "exact" })
      .eq("explanation", "[]");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: count ?? 0, message: `Purged ${count ?? 0} bad cached explanations` });
  }

  if (action === "reset_quota") {
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const today = new Date().toISOString().split("T")[0];
    const { error, count } = await sb
      .from("ai_usage")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("usage_date", today);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: count ?? 0, message: `Reset quota for ${userId} on ${today}` });
  }

  return NextResponse.json({ error: "Use ?action=purge_bad_cache or ?action=reset_quota&userId=xxx" }, { status: 400 });
}
