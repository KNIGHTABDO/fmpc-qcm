import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["aabidaabdessamad@gmail.com", "knight007youtu@gmail.com"];

export async function GET() {
  try {
    // Auth via cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const today = new Date().toISOString().split("T")[0];

    // Fetch today's usage per multiplier category
    const { data: usageRows } = await db
      .from("ai_usage")
      .select("multiplier, count")
      .eq("user_id", user.id)
      .eq("usage_date", today);

    // Fetch category limits from ai_rate_limits
    const { data: limitRows } = await db
      .from("ai_rate_limits")
      .select("multiplier, daily_limit, label");

    // Build response
    const categories = [
      { multiplier: 0, label: "Gratuit", color: "#22c55e" },
      { multiplier: 1, label: "Premium", color: "#a78bfa" },
      { multiplier: 3, label: "Lourd",   color: "#f87171" },
    ].map(cat => {
      const usageRow = (usageRows ?? []).find(r => r.multiplier === cat.multiplier);
      const limitRow = (limitRows ?? []).find(r => r.multiplier === cat.multiplier);
      const used = usageRow?.count ?? 0;
      const limit = limitRow?.daily_limit ?? (cat.multiplier === 0 ? 0 : cat.multiplier === 1 ? 10 : 5);
      const labelOverride = limitRow?.label ?? cat.label;
      return {
        multiplier: cat.multiplier,
        label: labelOverride,
        color: cat.color,
        used,
        limit,  // 0 = unlimited
        remaining: limit === 0 ? null : Math.max(0, limit - used),
        unlimited: limit === 0 || isAdmin,
      };
    });

    return NextResponse.json({ categories, isAdmin, date: today });
  } catch (e) {
    console.error("[quota] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
