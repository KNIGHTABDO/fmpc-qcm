"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, BarChart2, User, Settings, Sun, Moon,
  Bookmark, Trophy, ShieldCheck, Sparkles, Users2,
  Layers, Mic, Award, ChevronDown, GraduationCap, LogOut
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "aabidaabdessamad@gmail.com";

type Semester = { semestre_id: string; nom: string; faculty: string; total_questions: number };

const NAV_SECTIONS = [
  {
    label: "Étude",
    items: [
      { href: "/semestres", icon: BookOpen, label: "Semestres", tourId: "semestres" },
      { href: "/flashcards", icon: Layers, label: "Flashcards", tourId: "flashcards" },
      { href: "/revision", icon: GraduationCap, label: "Révision ciblée", tourId: "revision" },
    ],
  },
  {
    label: "IA",
    items: [
      { href: "/chatwithai", icon: Sparkles, label: "Chat IA", tourId: "chatwithai", accent: true },
      { href: "/voice", icon: Mic, label: "Mode vocal", tourId: "voice" },
    ],
  },
  {
    label: "Social",
    items: [
      { href: "/leaderboard", icon: Trophy, label: "Classement", tourId: "leaderboard" },
      { href: "/study-rooms", icon: Users2, label: "Salles d'étude", tourId: "study-rooms" },
    ],
  },
];

const NAV_BOTTOM = [
  { href: "/stats", icon: BarChart2, label: "Statistiques", tourId: "stats" },
  { href: "/bookmarks", icon: Bookmark, label: "Favoris", tourId: "bookmarks" },
  { href: "/certificates", icon: Award, label: "Certificats", tourId: "certificates" },
];

export function Sidebar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
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
    ? semesters.filter(s => {
        const id = s.semestre_id.toUpperCase();
        const n = userSemKey.replace("S", "");
        return id === userSemKey
          || id === ("S"+n+"_FMPC") || id === ("S"+n+"_FMPM")
          || id === ("S"+n+"_FMPR") || id === ("S"+n+"_UM6")
          || id === ("S"+n+"_FMPDF") || id === ("S"+n+"_PHARMA_UM6");
      })
    : semesters;

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  // Avatar initials
  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 border-r z-50"
      style={{ background: "var(--nav-bg)", borderColor: "var(--nav-border)" }}
    >
      {/* ── Brand ── */}
      <div
        className="px-4 py-4 flex-shrink-0 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0"
          style={{ background: "var(--surface-active)", border: "1px solid var(--border)" }}
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
        {/* Theme toggle — top right of brand area */}
        <button
          onClick={toggle}
          className="ml-auto p-1.5 rounded-lg transition-all"
          style={{ color: "var(--text-muted)", background: "var(--surface-alt)", border: "1px solid var(--border)" }}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          {theme === "dark"
            ? <Sun className="w-3.5 h-3.5" />
            : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4" style={{ scrollbarWidth: "thin" }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p
              className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
              style={{ color: "var(--text-disabled)" }}
            >
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-tour={item.tourId}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 group"
                    style={{
                      background: active ? "var(--nav-item-active)" : "transparent",
                      color: active ? "var(--nav-text-active)" : item.accent ? "var(--accent)" : "var(--nav-text)",
                      borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "var(--nav-item-hover)";
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.accent && (
                      <span
                        className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                      >
                        IA
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Semesters quick-access (under Étude section) */}
            {section.label === "Étude" && visibleSemesters.length > 0 && (
              <div className="mt-1">
                <button
                  onClick={() => setSemOpen(v => !v)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{ color: "var(--text-disabled)" }}
                >
                  <span className="flex-1 text-left">Mes semestres</span>
                  <ChevronDown
                    className={cn("w-3 h-3 transition-transform duration-200", semOpen && "rotate-180")}
                  />
                </button>
                <AnimatePresence>
                  {semOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pr-2 py-1 space-y-0.5">
                        {visibleSemesters.slice(0, 8).map(sem => (
                          <Link
                            key={sem.semestre_id}
                            href={`/semestres/${sem.semestre_id}`}
                            className="block px-2.5 py-1.5 rounded-lg text-[12px] transition-all truncate"
                            style={{
                              color: path.includes(sem.semestre_id) ? "var(--text)" : "var(--text-muted)",
                              background: path.includes(sem.semestre_id) ? "var(--surface-active)" : "transparent",
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = "var(--nav-item-hover)";
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = path.includes(sem.semestre_id) ? "var(--surface-active)" : "transparent";
                            }}
                          >
                            {sem.nom}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}

        {/* ── Divider ── */}
        <div className="h-px mx-2" style={{ background: "var(--divider)" }} />

        {/* ── Bottom nav items (within scrollable area) ── */}
        <div className="space-y-0.5">
          {NAV_BOTTOM.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tourId}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  background: active ? "var(--nav-item-active)" : "transparent",
                  color: active ? "var(--nav-text-active)" : "var(--nav-text)",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "var(--nav-item-hover)";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{
                color: isActive("/admin") ? "var(--nav-text-active)" : "var(--nav-text)",
                background: isActive("/admin") ? "var(--nav-item-active)" : "transparent",
                borderLeft: isActive("/admin") ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* ── User footer ── */}
      <div
        className="flex-shrink-0 px-2 py-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {user ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: "var(--surface-alt)" }}>
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text)" }}>
                {profile?.username ?? user.email?.split("@")[0] ?? "Utilisateur"}
              </p>
              {profile?.annee_etude && (
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  S{profile.annee_etude}
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Link
                href="/profile"
                className="p-1.5 rounded-md transition-all"
                style={{ color: "var(--text-muted)" }}
              >
                <User className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/settings"
                className="p-1.5 rounded-md transition-all"
                style={{ color: "var(--text-muted)" }}
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-md transition-all"
                style={{ color: "var(--text-muted)" }}
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/auth"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium w-full transition-all"
            style={{ background: "var(--surface-alt)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <User className="w-4 h-4" />
            Se connecter
          </Link>
        )}
      </div>
    </aside>
  );
}
