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
    const { data: usageToday } = await db
      .from("ai_usage")
      .select("multiplier, count")
      .eq("user_id", user.id)
      .eq("usage_date", today);

    // Fetch all-time usage per multiplier (for lifetime stats)
    const { data: usageAlltime } = await db
      .from("ai_usage")
      .select("multiplier, count")
      .eq("user_id", user.id);

    // Compute all-time totals grouped by multiplier
    const alltimeByMultiplier: Record<number, number> = {};
    for (const row of usageAlltime ?? []) {
      alltimeByMultiplier[row.multiplier] = (alltimeByMultiplier[row.multiplier] ?? 0) + row.count;
    }
    const totalAlltime = Object.values(alltimeByMultiplier).reduce((a, b) => a + b, 0);

    // Fetch category limits from ai_rate_limits
    const { data: limitRows } = await db
      .from("ai_rate_limits")
      .select("multiplier, daily_limit, label");

    // Build response — no hardcoded hex, use semantic identifiers for the UI
    const categories = [
      { multiplier: 0, label: "Gratuit",  colorKey: "success" },
      { multiplier: 1, label: "Premium",  colorKey: "accent"  },
      { multiplier: 3, label: "Lourd",    colorKey: "error"   },
    ].map(cat => {
      const usageRow = (usageToday ?? []).find(r => r.multiplier === cat.multiplier);
      const limitRow = (limitRows ?? []).find(r => r.multiplier === cat.multiplier);
      const used = usageRow?.count ?? 0;
      const limit = limitRow?.daily_limit ?? (cat.multiplier === 0 ? 0 : cat.multiplier === 1 ? 10 : 5);
      const labelOverride = limitRow?.label ?? cat.label;
      return {
        multiplier: cat.multiplier,
        label: labelOverride,
        colorKey: cat.colorKey,
        used,
        limit,        // 0 = unlimited
        usedAlltime: alltimeByMultiplier[cat.multiplier] ?? 0,
        remaining: limit === 0 ? null : Math.max(0, limit - used),
        unlimited: limit === 0 || isAdmin,
      };
    });

    return NextResponse.json({ categories, isAdmin, date: today, totalAlltime });
  } catch (e) {
    console.error("[quota] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
