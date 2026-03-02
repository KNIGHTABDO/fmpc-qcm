// @ts-nocheck
"use client";

/**
 * ZeroQCM — iPad Onboarding Guide
 * Targets: screens 640px–1023px (md, not yet lg)
 * iPad has BottomNav (not sidebar), different layout.
 * Shows once, only after login + activation.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, BookOpen, Sparkles,
  Bookmark, BarChart2, GraduationCap, Layers,
  Users2, Mic, Award, Trophy, CheckCircle2, Settings,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

type Step = {
  id: string;
  title: string;
  desc: string;
  detail?: string;
  icon: React.ElementType;
  /** CSS selector to spotlight */
  target: string | null;
  placement?: "above" | "below" | "center";
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Bienvenue sur ZeroQCM 🎉",
    desc: "La plateforme complète de révision médicale. On va te faire visiter en 2 minutes.",
    icon: Sparkles,
    target: null,
    placement: "center",
  },
  {
    id: "semestres",
    title: "Semestres S1→S9",
    desc: "Tous tes cours organisés par semestre, module et activité. 225 000+ questions classées.",
    detail: "Semestre → Module → Activité → QCM en un seul tap.",
    icon: BookOpen,
    target: "[data-tour='semestres']",
    placement: "above",
  },
  {
    id: "revision",
    title: "Révision ciblée",
    desc: "Travaille automatiquement tes points faibles grâce à l'analyse IA de tes résultats.",
    icon: GraduationCap,
    target: "[data-tour='revision']",
    placement: "above",
  },
  {
    id: "chatai",
    title: "Chat IA",
    desc: "Ton tuteur médical disponible 24h/24. Pose toutes tes questions, il cherche dans la base.",
    detail: "GPT-4.1, Gemini 3 Flash et DeepSeek R2 disponibles.",
    icon: Sparkles,
    target: "[data-tour='chatwithai']",
    placement: "above",
  },
  {
    id: "stats",
    title: "Tes statistiques",
    desc: "Taux de réussite par module, série quotidienne, classement et historique complet.",
    icon: BarChart2,
    target: "[data-tour='stats']",
    placement: "above",
  },
  {
    id: "bookmarks",
    title: "Favoris",
    desc: "Marque les questions difficiles pendant un quiz. Retrouve-les ici pour réviser.",
    icon: Bookmark,
    target: "[data-tour='bookmarks']",
    placement: "above",
  },
  {
    id: "leaderboard",
    title: "Classement",
    desc: "Compare-toi aux autres étudiants. Ton score monte à chaque bonne réponse.",
    icon: Trophy,
    target: "[data-tour='leaderboard']",
    placement: "above",
  },
  {
    id: "studyrooms",
    title: "Salles d'étude",
    desc: "Révise en groupe en temps réel avec d'autres étudiants.",
    icon: Users2,
    target: "[data-tour='study-rooms']",
    placement: "above",
  },
  {
    id: "voice",
    title: "Mode vocal",
    desc: "Révise les mains libres — idéal pour les transports.",
    icon: Mic,
    target: "[data-tour='voice']",
    placement: "above",
  },
  {
    id: "certificates",
    title: "Certificats",
    desc: "Complète des modules entiers pour obtenir des certificats de maîtrise.",
    icon: Award,
    target: "[data-tour='certificates']",
    placement: "above",
  },
  {
    id: "done",
    title: "C'est parti ! 🚀",
    desc: "Tu connais maintenant tout ZeroQCM. Commence par tes semestres ou demande quelque chose à l'IA.",
    icon: CheckCircle2,
    target: null,
    placement: "center",
  },
];

/* ─── Spotlight ─────────────────────────────────────────────────────────── */
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
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [selector]);
  return rect;
}

function SpotlightOverlay({ rect, padding = 10 }: { rect: DOMRect | null; padding?: number }) {
  if (!rect) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[900] pointer-events-auto"
        style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      />
    );
  }
  const t = rect.top - padding, l = rect.left - padding;
  const w = rect.width + padding * 2, h = rect.height + padding * 2;
  return (
    <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[900] pointer-events-none" style={{ width: "100vw", height: "100vh" }}>
      <defs>
        <mask id="zt-mask-ipad">
          <rect width="100%" height="100%" fill="white" />
          <rect x={l} y={t} width={w} height={h} rx="10" fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#zt-mask-ipad)" />
      <rect x={l} y={t} width={w} height={h} rx="10" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity={0.6} />
    </motion.svg>
  );
}

/* ─── Card (iPad: bottom-anchored sheet or centered modal) ────────────────── */
function GuideCard({
  step, index, total, rect, onNext, onBack, onSkip,
}: {
  step: Step; index: number; total: number; rect: DOMRect | null;
  onNext: () => void; onBack: () => void; onSkip: () => void;
}) {
  const Icon = step.icon;
  const isFirst = index === 0;
  const isLast  = index === total - 1;

  // iPad: always show card as bottom sheet when there's a spotlight target,
  // centered modal for welcome/done
  const isSheet = !!rect;
  const cardStyle: React.CSSProperties = isSheet
    ? { position: "fixed", bottom: 0, left: 0, right: 0, borderRadius: "20px 20px 0 0", maxHeight: "45vh" }
    : { position: "fixed", inset: 0, margin: "auto", width: "min(420px, calc(100vw - 40px))", height: "fit-content", borderRadius: "20px" };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none" aria-modal="true">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: isSheet ? 60 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isSheet ? 60 : 10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto px-5 pt-5 pb-6"
        style={{
          ...cardStyle,
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Drag handle (sheet only) */}
        {isSheet && (
          <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border-strong)" }} />
        )}

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)" }}>
              <Icon className="w-4.5 h-4.5" style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>{step.title}</p>
          </div>
          <button onClick={onSkip} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
        {step.detail && (
          <p className="text-[11px] mt-2 px-2.5 py-1.5 rounded-lg leading-relaxed"
            style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
            💡 {step.detail}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <motion.div key={i} className="rounded-full"
                animate={{ width: i === index ? 14 : 5, background: i === index ? "var(--accent)" : i < index ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)" }}
                transition={{ duration: 0.2 }} style={{ height: 5 }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button onClick={onBack}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Retour
              </button>
            )}
            <button onClick={onNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: isLast ? "var(--accent)" : "rgba(255,255,255,0.08)", color: isLast ? "var(--bg)" : "var(--text)", border: isLast ? "none" : "1px solid var(--border)" }}>
              {isLast ? "C'est parti !" : "Suivant"}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Export ──────────────────────────────────────────────────────────────── */
export function IpadOnboardingGuide() {
  const { user, profile, profileLoaded } = useAuth();
  const [visible,   setVisible]   = useState(false);
  const [step,      setStep]      = useState(0);
  const [mounted,   setMounted]   = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("activation_keys").select("status").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setActivated(data?.status === "approved"));
  }, [user?.id]);

  useEffect(() => {
    if (!mounted || !profileLoaded || !activated) return;
    const prefs = profile?.preferences as Record<string, unknown> | null;
    if (!prefs?.onboarding_done) {
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
    } catch { /**/ }
  }, [user]);

  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) finish();
    else setStep(s => s + 1);
  }, [step, finish]);

  const handleBack = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  const currentStep = STEPS[step];
  const rect = useSpotlight(mounted ? currentStep.target : null);

  useEffect(() => {
    if (!currentStep.target) return;
    const el = document.querySelector(currentStep.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step, currentStep.target]);

  if (!visible || !mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <SpotlightOverlay rect={currentStep.target ? rect : null} />
          <GuideCard
            step={currentStep} index={step} total={STEPS.length}
            rect={currentStep.target ? rect : null}
            onNext={handleNext} onBack={handleBack} onSkip={finish}
          />
        </>
      )}
    </AnimatePresence>
  );
}
