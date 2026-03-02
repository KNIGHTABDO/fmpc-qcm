"use client";
import { use, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Bookmark, RefreshCcw, ChevronLeft } from "lucide-react";
import React, { useState as uS, useEffect as uE, useCallback as uC, useRef} from "react";
import KaTeX from "katex";
import "katex/dist/katex.min.css";


// The `page` prop is never used in rendering -- only `use` is needed.
// The `key` is a special React prop -- not exposed in the component props
type PageProps = { params: Promise<{id: string}> };

type Question = {
  id: string;
  texte: string;
  source_question: string | null;
  correction: string | null;
  choices: {
    id: string;
    contenu: string;
    est_correct: boolean;
  }[];
};

type OptionExplanation = { letter: string; contenu: string; est_correct: boolean; why: string };
type ParsedAI = OptionExplanation[] | null;

function parseAI(raw: string): ParsedAI {
  try {
    let cleaned = raw.trim();
    // Strip markdown code block wrapper if present
    if (cleaned.startsWith("```")) {
      const firstNewline = cleaned.indexOf("\n");
      cleaned = firstNewline !== -1 ? cleaned.slice(firstNewline + 1) : cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, cleaned.lastIndexOf("```"));
    }
    cleaned = cleaned.trim();
    // If model added preamble text before the JSON array
    const arrStart = cleaned.indexOf("[");
    if (arrStart > 0) cleaned = cleaned.slice(arrStart);
    // If JSON is incomplete (stream cut), try to seal it
    if (!cleaned.endsWith("]")) {
      // Find last well-formed object end
      const lastStop = cleaned.lastIndexOf("}");
      if (lastStop === -1) return null;
      cleaned = cleaned.slice(0, lastStop + 1) + "]";
    }
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed[0].letter || !parsed[0].why) return null;
    return parsed as OptionExplanation[];
  } catch {
    return null;
  }
}

// Inline KTeX rendering -- handles both inline ($ $) and block ($$ $$) math
function inlineFormat(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    // Try to match block math first ($$ ... $$)
    const blockMatch = remaining.match(/^([\s\S]*?)\$\$([\s\S]+?)\$\$([\s\S]*)$/);
    if (blockMatch) {
      const [_, before, math, after] = blockMatch;
      if (before) parts.push(...inlineFormat(before));
      try {
        parts.push(<span key={key} dangerouslySetInnerHTML={{ __html: KaTeX.renderToString(math, { displayMode: true, throwOnError: false }) }} />);
      } catch { parts.push(math); }
      key++;
      remaining = after;
      continue;
    }
    // Try inline math ($ ... $)
    const inlineMatch = remaining.match(/^([\s\S]*?)\$([^{\']+$?)\$([\s\S]*)$/);
    if (inlineMatch) {
      const [_, before, math, after] = inlineMatch;
      if (before) parts.push(...inlineFormat(before));
      try {
        parts.push(<span key={key} dangerouslySetInnerHTML={{ __html: KaTeX.renderToString(math, { displayMode: false, throwOnError: false }) }} />);
      } catch { parts.push(math); }
      key++;
      remaining = after;
      continue;
    }
    // No math -- render as plain text
    parts.push(remaining);
    break;
  }
  return parts;
}

export default function QuizPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Supabase browser client (memoized to avoid re-creating on rerender)
  const supabase = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  ).current;

  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<"question" | "result">("question");
  const [history, setHistory] = useState<Map<number, Set<string>>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [activityId, setActivityId] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiParsed, setAiParsed] = useState<ParsedAI)>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCached, setAiCached] = useState<string | null>(null);
  const saveTimerRef = useRef <ReturnType<typeof setTimeout> | null>(null);

  // Fetch user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({data: {user}}) => setUser(user));
  }, [supabase]);

  // Fetch all questions for this activity
  useEffect(() => {
    if (!id) return;
    (a