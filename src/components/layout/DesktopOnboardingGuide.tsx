// @ts-nocheck
"use client";

/**
 * ZeroQCM — Desktop Onboarding Guide
 * Targets: screens ≥ 1024px (lg+)
 * Shows once per account, only after login + activation.
 * Steps navigate the user through every section of the app.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, Home, BookOpen,
  Sparkles, Bookmark, BarChart2, Settings, Trophy,
  GraduationCap, Layers, Users2, Mic, Award, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

/* ─── Step catalogue ──────────────────────────────────────────────────────── */
type Step = {
  id: string;
  title: string;
  desc: string;
  detail?: string;
  icon: React.ElementType;
  /** CSS selector to spotlight (null = centred modal) */
  target: string | null;
  placement?: "right" | "left" | "top" | "bottom";
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Bienvenue sur ZeroQCM 🎉",
    desc: "La plateforme de révision médicale complète pour les étudiants marocains. Faisons le tour de tout ce que tu peux faire ici — ça prend 2 minutes.",
    icon: Sparkles,
    target: null,
  },
  {
    id: "semestres",
    title: "Semestres — ton plan de cours",
    desc: "Toute ta scolarité organisée par semestre (S1→S9) et par faculté. Chaque semestre contient ses modules, et chaque module ses activités.",
    detail: "Clique sur un semestre → un module → une activité pour lancer un QCM instantanément.",
    icon: BookOpen,
    target: "[data-tour='semestres']",
    placement: "right",
  },
  {
    id: "revision",
    title: "Révision ciblée",
    desc: "L'IA analyse tes résultats passés et te propose les questions sur lesquelles tu es le plus faible.",
    detail: "Lance une session de révision ciblée pour travailler tes points faibles automatiquement.",
    icon: GraduationCap,
    target: "[data-tour='revision']",
    placement: "right",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    desc: "Mémorise les concepts clés avec des fiches interactives. Actuellement en maintenance — revenez bientôt !",
    icon: Layers,
    target: "[data-tour='flashcards']",
    placement: "right",
  },
  {
    id: "chatai",
    title: "Chat IA — ton tuteur 24h/24",
    desc: "Pose n'importe quelle question médicale. L'IA cherche dans la base de 225 000+ QCM et répond avec des exemples réels.",
    detail: "Modèles disponibles : GPT-4.1, Gemini 3 Flash, DeepSeek R2. Chaque message compte sur ton quota journalier.",
    icon: Sparkles,
    target: "[data-tour='chatwithai']",
    placement: "right",
  },
  {
    id: "voice",
    title: "Mode vocal",
    desc: "Révise les mains libres. Écoute les questions et réponds à voix haute.",
    icon: Mic,
    target: "[data-tour='voice']",
    placement: "right",
  },
  {
    id: "leaderboard",
    title: "Classement",
    desc: "Compare-toi avec les autres étudiants. Ton score monte chaque fois que tu réponds correctement.",
    icon: Trophy,
    target: "[data-tour='leaderboard']",
    placement: "right",
  },
  {
    id: "studyrooms",
    title: "Salles d'étude",
    desc: "Révise en groupe en temps réel. Créé ou rejoins une salle pour s'entraîner ensemble.",
    icon: Users2,
    target: "[data-tour='study-rooms']",
    placement: "right",
  },
  {
    id: "stats",
    title: "Statistiques — ta progression",
    desc: "Taux de réussite par module, série quotidienne, temps passé, classement — tout est tracé automatiquement.",
    icon: BarChart2,
    target: "[data-tour='stats']",
    placement: "right",
  },
  {
    id: "bookmarks",
    title: "Favoris",
    desc: "Pendant un quiz, marque les questions difficiles. Retrouve-les ici pour les réviser plus tard.",
    icon: Bookmark,
    target: "[data-tour='bookmarks']",
    placement: "right",
  },
  {
    id: "certificates",
    title: "Certificats",
    desc: "Complète des modules entiers pour obtenir des certificats de maîtrise partageables.",
    icon: Award,
    target: "[data-tour='certificates']",
    placement: "right",
  },
  {
    id: "settings",
    title: "Paramètres",
    desc: "Choisis ton modèle IA par défaut, gère ton profil, bascule entre mode sombre et clair.",
    detail: "Tu peux revenir ici à tout moment depuis le bas de la barre latérale.",
    icon: Settings,
    target: null,
  },
  {
    id: "done",
    title: "C'est parti ! 🚀",
    desc: "Tu connais maintenant tout ZeroQCM. Commence par explorer tes semestres ou pose une question à l'IA.",
    detail: "Ce guide ne s'affichera plus. Tu peux toujours retrouver les infos dans Paramètres → Aide.",
    icon: CheckCircle2,
    target: null,
  },
];

/* ─── Spotlight hook ──────────────────────────────────────────────────────── */
function useSpotlight(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) { setRect(null); return; }
    const update = () => {
      const els = Array.from(document.querySelectorAll(selector));
      const visible = els.find(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) ?? els[0] ?? null;
      setRect(visible ? (visible as Element).getBoundingClientRect() : null);
    };
    update();
    const ro = new ResizeObserver(update);
    const mo = new MutationObserver(update);
    Array.from(document.querySelectorAll(selector)).forEach(el => ro.observe(el));
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect(); mo.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [selector]);

  return rect;
}

/* ─── SVG cutout overlay ──────────────────────────────────────────────────── */
function SpotlightOverlay({ rect, padding = 12 }: { rect: DOMRect | null; padding?: number }) {
  if (!rect) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[900] pointer-events-auto"
        style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      />
    );
  }
  const t = Math.round(rect.top - padding);
  const l = Math.round(rect.left - padding);
  const w = Math.round(rect.width + padding * 2);
  const h = Math.round(rect.height + padding * 2);
  return (
    <motion.svg
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[900] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    >
      <defs>
        <mask id="zt-mask-desktop">
          <rect width="100%" height="100%" fill="white" />
          <rect x={l} y={t} width={w} height={h} rx="10" fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.80)" mask="url(#zt-mask-desktop)" />
      <motion.rect
        x={l} y={t} width={w} height={h} rx="10" fill="none"
        stroke="var(--accent)" strokeWidth="1.5" opacity={0.6}
        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
      />
    </motion.svg>
  );
}

/* ─── Tooltip positioning ─────────────────────────────────────────────────── */
function getTooltipStyle(rect: DOMRect | null, placement: Step["placement"]): React.CSSProperties {
  const PAD = 20;
  const CARD_W = 340;
  if (!rect) {
    return { position: "fixed", inset: 0, margin: "auto", width: `${CARD_W}px`, height: "fit-content" };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const midY = Math.round(rect.top + rect.height / 2);

  switch (placement) {
    case "right": {
      let lp = rect.right + PAD;
      if (lp + CARD_W > vw - PAD) lp = Math.max(PAD, rect.left - CARD_W - PAD);
      return { position: "fixed", top: `${Math.max(PAD, Math.min(midY - 120, vh - 320))}px`, left: `${lp}px`, width: `${CARD_W}px` };
    }
    case "left": {
      const lp = Math.max(PAD, rect.left - CARD_W - PAD);
      return { position: "fixed", top: `${Math.max(PAD, Math.min(midY - 120, vh - 320))}px`, left: `${lp}px`, width: `${CARD_W}px` };
    }
    default: {
      const isTop = placement === "top";
      return {
        position: "fixed",
        ...(isTop ? { bottom: `${vh - rect.top + PAD}px` } : { top: `${Math.min(rect.bottom + PAD, vh - 320)}px` }),
        left: `${PAD}px`, right: `${PAD}px`, width: "auto",
      };
    }
  }
}

/* ─── Tooltip card ────────────────────────────────────────────────────────── */
function TooltipCard({
  step, index, total, rect, onNext, onBack, onSkip,
}: {
  step: Step; index: number; total: number; rect: DOMRect | null;
  onNext: () => void; onBack: () => void; onSkip: () => void;
}) {
  const Icon = step.icon;
  const isFirst = index === 0;
  const isLast  = index === total - 1;
  const posStyle = getTooltipStyle(rect, step.placement);

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none" aria-modal="true">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto rounded-2xl px-5 py-4 shadow-2xl"
        style={{
          ...posStyle,
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)" }}
            >
              <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
              {step.title}
            </p>
          </div>
          <button
            onClick={onSkip}
            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
            aria-label="Passer le guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <p className="text-[13px] leading-relaxed mb-1" style={{ color: "var(--text-secondary)" }}>
          {step.desc}
        </p>
        {step.detail && (
          <p
            className="text-[11px] leading-relaxed mt-2 px-2.5 py-1.5 rounded-lg"
            style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
          >
            💡 {step.detail}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-4">
          {/* Progress pill-dots */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                animate={{
                  width:      i === index ? 16 : 5,
                  background: i === index ? "var(--accent)" : i < index ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)",
                }}
                transition={{ duration: 0.2 }}
                style={{ height: 5 }}
              />
            ))}
          </div>
          {/* Step counter */}
          <p className="text-[10px] tabular-nums" style={{ color: "var(--text-disabled)" }}>
            {index + 1}/{total}
          </p>
          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/8"
                style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
              >
                <ArrowLeft className="w-3 h-3" /> Retour
              </button>
            )}
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                background: isLast ? "var(--accent)" : "rgba(255,255,255,0.08)",
                color:      isLast ? "var(--bg)"     : "var(--text)",
                border:     isLast ? "none"           : "1px solid var(--border)",
              }}
            >
              {isLast ? "C'est parti !" : "Suivant"}
              {!isLast && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export function DesktopOnboardingGuide() {
  const { user, profile, profileLoaded } = useAuth();
  const [visible,  setVisible]  = useState(false);
  const [step,     setStep]     = useState(0);
  const [mounted,  setMounted]  = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Check activation
  useEffect(() => {
    if (!user) return;
    supabase.from("activation_keys").select("status").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setActivated(data?.status === "approved"));
  }, [user?.id]);

  // Show guide: only if logged in + activated + not already seen
  useEffect(() => {
    if (!mounted || !profileLoaded || !activated) return;
    const prefs = profile?.preferences as Record<string, unknown> | null;
    const done = prefs?.onboarding_done;
    if (!done) {
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, [mounted, profileLoaded, profile, activated]);

  const finish = useCallback(async () => {
    setVisible(false);
    if (!user) return;
    try {
      const { data: p } = await supabase.from("profiles").select("preferences").eq("id", user.id).single();
      const prefs = (p?.preferences as Record<string, unknown>) ?? {};
      await supabase.from("profiles").update({ preferences: { ...prefs, onboarding_done: true } }).eq("id", user.id);
    } catch { /* non-fatal */ }
  }, [user]);

  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) finish();
    else setStep(s => s + 1);
  }, [step, finish]);

  const handleBack = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  // Scroll target into view on step change
  const currentStep = STEPS[step];
  useEffect(() => {
    if (!currentStep.target) return;
    const el = document.querySelector(currentStep.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step, currentStep.target]);

  const rect = useSpotlight(mounted ? currentStep.target : null);

  if (!visible || !mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <SpotlightOverlay rect={currentStep.target ? rect : null} />
          <TooltipCard
            step={currentStep} index={step} total={STEPS.length}
            rect={currentStep.target ? rect : null}
            onNext={handleNext} onBack={handleBack} onSkip={finish}
          />
        </>
      )}
    </AnimatePresence>
  );
}
