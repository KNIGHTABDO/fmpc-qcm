"use client";
import { use, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle, Brain, MessageSquare,
  ChevronRight, RotateCcw, BookOpen, Trophy, Clock,
  ChevronLeft, Bookmark, RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import KaTeX from "katex";
import "katex/dist/katex.min.css";