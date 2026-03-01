"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, BarChart2, User, Settings, Sun, Moon,
  Bookmark, Trophy, ShieldCheck, Sparkles, Users2,
  Layers, Mic, Award, ChevronDown, GraduationCap, LayoutDashboard
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "aabidaabdessamad@gmail.com";

type Semester = { semestre_id: string; nom: string; faculty: string; total_questions: number };

// ── Navigation structure ────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Étude",
    items: [
      { href: "/semestres", icon: BookOpen,   label: "Semestres",    tourId: "semestres" },
      { href: "/flashcards",icon: Layers,     label: "Flashcards",   tourId: "flashcards" },
      { href: "/revision",  icon: GraduationCap, label: "Révision ciblée", tourId: "revision" },
    ],
  },
  {
    label: "IA",
    items: [
      { href: "/chatwithai",icon: Sparkles,   label: "Chat IA",      tourId: "chatwithai", accent: true },
      { href: "/voice",     icon: Mic,        label: "Mode vocal",   tourId: "voice" },
    ],
  },
  {
    label: "Social",
    items: [
      { href: "/leaderboard", icon: Trophy,  label: "Classement",   tourId: "leaderboard" },
      { href: "/study-rooms", icon: Users2,  label: "Salles d\'étude", tourId: "study-rooms" },
    ],
  },
];

const NAV_BOTTOM = [
  { href: "/stats",       icon: BarChart2, label: "Statistiques",  tourId: "stats" },
  { href: "/bookmarks",   icon: Bookmark,  label: "Favoris",       tourId: "bookmarks" },
  { href: "/certificates",icon: Award,     label: "Certificats",   tourId: "certificates" },
];

export function Sidebar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const { user, profile } = useAuth();
  const [semOpen, setSemOpen] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    supabase
      .from("semesters")
      .select("semestre_id, nom, faculty, total_questions")
      .order("faculty")
      .then(({ data }) => setSemesters(data ?? []));
  }, []);

  const YEAR_TO_SEM: Record<number, string> = {
    1:"S1",2:"S2",3:"S3",4:"S4",5:"S5",
    6:"S6",7:"S7",8:"S8",9:"S9",10:"S10"
  };
  const userSemKey = profile?.annee_etude ? (YEAR_TO_SEM[profile.annee_etude] ?? null) : null;
  const visibleSemesters = userSemKey
    ? semesters.filter((s) => {
        const id = s.semestre_id.toUpperCase();
        const n = userSemKey.replace("S", "");
        return id === userSemKey
          || id === ("S"+n+"_FMPC") || id === ("S"+n+"_FMPM")
          || id === ("S"+n+"_FMPR") || id === ("S"+n+"_UM6")
          || id === ("S"+n+"_FMPDF") || id === ("S"+n+"_PHARMA_UM6");
      })
    : semesters;

  const isActive = (href: string) =>
    href === "/"
      ? path === "/"
      : path === href || path.startsWith(href + "/");

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 border-r z-50 overflow-y-auto overflow-x-hidden"
      style={{ background: "var(--nav-bg)", borderColor: "var(--nav-border)" }}
    >
      {/* ── Brand ── */}
      <div
        className="px-4 py-4 flex-shrink-0 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="ZeroQCM" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-[13px] font-bold tracking-tight" style={{ color: "var(--text)" }}>
            ZeroQCM
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Révision médicale
          </p>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            <p
              className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-tour={item.tourId}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium",
                      "transition-all duration-150"
                    )}
                    style={{
                      background: active ? "var(--nav-item-active)" : "transparent",
                      color: active
                        ? (item as { accent?: boolean }).accent ? "var(--accent)" : "var(--nav-text-active)"
                        : "var(--nav-text)",
                    }}
                  >
                    {/* Active left border */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                        style={{ background: (item as { accent?: boolean }).accent ? "var(--accent)" : "var(--text)" }}
                      />
                    )}
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Semesters accordion (under Étude) ── */}
        <div>
          <button
            onClick={() => setSemOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
            style={{
              color: "var(--nav-text)",
              background: semOpen ? "var(--nav-item-hover)" : "transparent",
            }}
          >
            <span className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" />
              Mes semestres
            </span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 transition-transform duration-200", semOpen ? "" : "-rotate-90")}
            />
          </button>

          <AnimatePresence initial={false}>
            {semOpen && (
              <motion.div
                key="sem"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-1 pl-3 space-y-0.5">
                  {semesters.length === 0
                    ? [1, 2, 3].map((i) => (
                        <div key={i} className="h-8 rounded-lg skeleton" />
                      ))
                    : visibleSemesters.map((sem) => {
                        const href = `/semestres/${encodeURIComponent(sem.semestre_id)}`;
                        const active = path === href || path.startsWith(href + "/");
                        return (
                          <Link
                            key={sem.semestre_id}
                            href={href}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-all duration-150"
                            style={{
                              background: active ? "var(--nav-item-active)" : "transparent",
                              color: active ? "var(--nav-text-active)" : "var(--nav-text)",
                            }}
                          >
                            <span className="truncate">{sem.nom}</span>
                            <span className="text-[10px] flex-shrink-0 ml-1 tabular-nums" style={{ color: "var(--text-muted)" }}>
                              {(sem.total_questions ?? 0).toLocaleString()}
                            </span>
                          </Link>
                        );
                      })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom secondary items ── */}
        <div style={{ borderTop: "1px solid var(--border)" }} className="pt-3 space-y-0.5">
          {NAV_BOTTOM.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tourId}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                style={{
                  background: active ? "var(--nav-item-active)" : "transparent",
                  color: active ? "var(--nav-text-active)" : "var(--nav-text)",
                }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                background: path.startsWith("/admin") ? "rgba(255,255,255,0.07)" : "transparent",
                color: path.startsWith("/admin") ? "var(--nav-text-active)" : "var(--nav-text)",
              }}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Admin
            </Link>
          )}
        </div>
      </nav>

      {/* ── Footer: user + theme ── */}
      <div
        className="px-2 py-3 flex-shrink-0 space-y-0.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
          style={{ color: "var(--nav-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nav-item-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Mode clair" : "Mode sombre"}
        </button>

        {/* User profile */}
        {user && (
          <Link
            href="/profil"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150"
            style={{ color: "var(--nav-text)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nav-item-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
              }}
            >
              {(profile?.full_name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
            <span className="truncate text-[12px]" style={{ color: "var(--text-secondary)" }}>
              {profile?.full_name ?? user.email}
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
