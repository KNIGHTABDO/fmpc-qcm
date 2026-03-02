"use client";
import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("FMPC");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const FACULTY_SEM: Record<string, string> = {
    FMPC: "s1", FMPR: "S1_FMPR", FMPM: "S1_FMPM", UM6SS: "S1_UM6", FMPDF: "s1_FMPDF",
  };

  useEffect(() => {
    if (user && pendingRedirect) {
      router.replace(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [user, pendingRedirect, router]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const nextPath = searchParams.get("next") || null;
    if (mode === "signin") {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err); setLoading(false); }
      else setPendingRedirect(nextPath ?? "/semestres/s1");
    } else {
      if (!name.trim()) { setError("Entrez votre prénom"); setLoading(false); return; }
      const { error: err } = await signUp(email, password, name, faculty);
      if (err) { setError(err); setLoading(false); }
      else setPendingRedirect(nextPath ?? "/semestres/s1");
    }
  }

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--input-text)",
    borderRadius: 12,
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden"
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="ZeroQCM" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--text)" }}>ZeroQCM</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            {mode === "signin" ? "Bon retour !" : "Crée ton compte"}
          </p>
        </div>

        {/* Mode tabs */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
        >
          {(["signin", "signup"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: mode === m ? "var(--bg-secondary)" : "transparent",
                color: mode === m ? "var(--text)" : "var(--text-muted)",
                boxShadow: mode === m ? "var(--shadow-sm)" : "none",
              }}
            >
              {m === "signin" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handle} className="space-y-3">
          {/* Name (signup only) */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Prénom"
                  required={mode === "signup"}
                  className="w-full px-4 py-3 text-[14px] outline-none"
                  style={{ ...inputStyle, caretColor: "var(--accent)" }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 text-[14px] outline-none"
            style={{ ...inputStyle, caretColor: "var(--accent)" }}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="w-full px-4 py-3 pr-12 text-[14px] outline-none"
              style={{ ...inputStyle, caretColor: "var(--accent)" }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1"
              style={{ color: "var(--text-muted)" }}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Faculty (signup only) */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <select
                  value={faculty}
                  onChange={e => setFaculty(e.target.value)}
                  className="w-full px-4 py-3 text-[14px] outline-none appearance-none"
                  style={{ ...inputStyle }}
                >
                  <option value="FMPC">FMPC – Casablanca</option>
                  <option value="FMPR">FMPR – Rabat</option>
                  <option value="FMPM">FMPM – Marrakech</option>
                  <option value="UM6SS">UM6SS – UM6</option>
                  <option value="FMPDF">FMPDF – Fès</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[12px] px-3 py-2 rounded-lg"
                style={{
                  background: "var(--error-subtle)",
                  color: "var(--error)",
                  border: "1px solid var(--error-border)",
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all mt-2"
            style={{
              background: loading ? "var(--surface-active)" : "var(--text)",
              color: loading ? "var(--text-muted)" : "var(--bg)",
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signin" ? (
              "Se connecter"
            ) : (
              "Créer mon compte"
            )}
          </motion.button>
        </form>

        <p className="text-center text-[12px] mt-6" style={{ color: "var(--text-muted)" }}>
          En continuant, tu acceptes les conditions d'utilisation de ZeroQCM.
        </p>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
