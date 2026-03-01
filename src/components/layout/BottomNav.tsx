"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, Sparkles, Trophy, Grid3x3,
  BarChart2, Bookmark, Users2, Layers, Mic, Award, User, Settings, X,
  GraduationCap
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Primary bar (always visible, 5 items max on mobile) ─────────────
const PRIMARY_NAV = [
  { href: "/",           icon: Home,     label: "Accueil"  },
  { href: "/semestres",  icon: BookOpen, label: "QCM"      },
  { href: "/chatwithai", icon: Sparkles, label: "Chat IA", accent: true },
  { href: "/leaderboard",icon: Trophy,   label: "Top"      },
  { href: "/__more__",   icon: Grid3x3,  label: "Plus", isMore: true },
];

// ── More drawer grid ─────────────────────────────────────────────────
const MORE_NAV = [
  { href: "/flashcards",   icon: Layers,     label: "Flashcards"    },
  { href: "/revision",     icon: GraduationCap, label: "Révision"   },
  { href: "/study-rooms",  icon: Users2,     label: "Salles"        },
  { href: "/stats",        icon: BarChart2,  label: "Stats"         },
  { href: "/bookmarks",    icon: Bookmark,   label: "Favoris"       },
  { href: "/certificates", icon: Award,      label: "Certificats"   },
  { href: "/profil",       icon: User,       label: "Profil"        },
  { href: "/settings",     icon: Settings,   label: "Paramètres"    },
];

export function BottomNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [path]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/");

  const moreActive = MORE_NAV.some((i) => isActive(i.href));

  return (
    <>
      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: "var(--overlay)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom sheet (More) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={sheetRef}
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderBottom: "none",
              paddingBottom: "max(24px, env(safe-area-inset-bottom))",
            }}
          >
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
            </div>

            {/* Close button */}
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                Plus d'options
              </p>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-alt)" }}
              >
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-1 px-3 pb-2">
              {MORE_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all duration-150"
                    style={{
                      background: active ? "var(--nav-item-active)" : "transparent",
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon
                      className="w-5 h-5"
                      style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}
                    />
                    <span
                      className="text-[10px] font-medium text-center leading-tight"
                      style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed bottom bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--nav-bg)",
          borderTop: "1px solid var(--nav-border)",
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-around px-1 pt-1.5 pb-0.5">
          {PRIMARY_NAV.map((item) => {
            if ((item as { isMore?: boolean }).isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setOpen((v) => !v)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px] transition-all duration-150"
                  style={{
                    background: open || moreActive ? "var(--nav-item-active)" : "transparent",
                  }}
                >
                  <Grid3x3
                    className="w-[22px] h-[22px]"
                    style={{ color: open || moreActive ? "var(--text)" : "var(--nav-text)" }}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: open || moreActive ? "var(--text)" : "var(--nav-text)" }}
                  >
                    Plus
                  </span>
                </button>
              );
            }

            const active = isActive(item.href);
            const isAccent = (item as { accent?: boolean }).accent;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px] transition-all duration-150"
                style={{
                  background: active ? "var(--nav-item-active)" : "transparent",
                }}
              >
                <item.icon
                  className="w-[22px] h-[22px]"
                  style={{
                    color: active && isAccent ? "var(--accent)"
                         : active ? "var(--nav-text-active)"
                         : "var(--nav-text)",
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: active && isAccent ? "var(--accent)"
                         : active ? "var(--nav-text-active)"
                         : "var(--nav-text)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
