"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Camera, Save, Loader2, Check, Trophy, Target, BookOpen, Flame } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase, getUserStats } from "@/lib/supabase";

const YEARS = [1,2,3,4,5,6,7,8,9];
const FACULTIES = ["FMPC","FMPR","FMPM","UM6SS","FMPDF"];
const FACULTY_NAMES: Record<string, string> = {
  FMPC: "FMPC – Casablanca",
  FMPR: "FMPR – Rabat",
  FMPM: "FMPM – Marrakech",
  UM6SS: "UM6SS – UM6",
  FMPDF: "FMPDF – Fès",
};

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [year, setYear] = useState<number>(1);
  const [faculty, setFaculty] = useState("FMPC");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0, rate: 0, streak: 0 });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setYear(profile.annee_etude ?? 1);
      setFaculty(profile.faculty ?? "FMPC");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      getUserStats(user.id).then(s => setStats(s));
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      username: username.trim() || null,
      annee_etude: year,
      faculty,
    }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const initials = username ? username.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() ?? "??";
  const rate = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;

  const statCards = [
    { label: "Questions", value: stats.total.toLocaleString(), icon: BookOpen, color: "var(--accent)" },
    { label: "Précision", value: `${rate}%`, icon: Target, color: "var(--success)" },
    { label: "Série", value: `${stats.streak}j`, icon: Flame, color: "var(--warning)" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-lg mx-auto px-4 pt-6 md:pt-8 pb-24 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Mon profil</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Personnalise ton espace d'étude
          </p>
        </div>

        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4 p-5 rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              border: "2px solid var(--accent-border)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>
              {profile?.username ?? user?.email?.split("@")[0] ?? "Utilisateur"}
            </p>
            <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {user?.email}
            </p>
            {profile?.annee_etude && (
              <span
                className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "var(--surface-active)", color: "var(--text-secondary)" }}
              >
                S{profile.annee_etude}
              </span>
            )}
          </div>
        </motion.div>

        {/* Stats row */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="flex flex-col items-center gap-1.5 py-4 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                  <p className="text-[17px] font-bold tabular-nums" style={{ color: "var(--text)" }}>
                    {s.value}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Edit form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          onSubmit={handleSave}
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
            Informations
          </h2>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Prénom / Pseudo
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ton prénom"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text)",
                caretColor: "var(--accent)",
              }}
            />
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Année d'étude
            </label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none appearance-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text)",
              }}
            >
              {YEARS.map(y => (
                <option key={y} value={y}>Semestre {y}</option>
              ))}
            </select>
          </div>

          {/* Faculty */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Faculté
            </label>
            <select
              value={faculty}
              onChange={e => setFaculty(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none appearance-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text)",
              }}
            >
              {FACULTIES.map(f => (
                <option key={f} value={f}>{FACULTY_NAMES[f]}</option>
              ))}
            </select>
          </div>

          {/* Save button */}
          <motion.button
            type="submit"
            disabled={saving || authLoading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: saved ? "var(--success-subtle)" : "var(--text)",
              color: saved ? "var(--success)" : "var(--bg)",
              border: saved ? "1px solid var(--success-border)" : "none",
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <><Check className="w-4 h-4" /> Sauvegardé</>
            ) : (
              <><Save className="w-4 h-4" /> Sauvegarder</>
            )}
          </motion.button>
        </motion.form>
      </div>
    </main>
  );
}
