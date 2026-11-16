"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, Loader2, ArrowRight,
  MessageSquare, Video, FileText, CheckSquare, Zap, ShieldCheck, CheckCircle2
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const features = [
    { icon: MessageSquare, text: "Real-time team chat" },
    { icon: Video, text: "HD video calls" },
    { icon: FileText, text: "Collaborative documents" },
    { icon: CheckSquare, text: "Task management" },
  ];

  return (
    <main className="min-h-screen bg-background flex">
      
      {/* ===================== LEFT PANEL (Branding) ===================== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between p-12">
        
        {/* Animated Background Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" 
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Nexus</span>
          </Link>
        </div>

        {/* Hero Text & Features */}
        <div className="relative z-10 max-w-md">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-6"
          >
            Welcome back. <br />
            <span className="text-emerald-400">Let's get to work.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-slate-400 text-[15px] leading-relaxed mb-8"
          >
            Sign in to access your team's workspace. Chat, plan, and write—all in one place.
          </motion.p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-slate-300 text-[14px] font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[12px] text-slate-500">
          <p>© {new Date().getFullYear()} Nexus. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Secure Login
          </div>
        </div>
      </div>

      {/* ===================== RIGHT PANEL (Form) ===================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-xl font-bold text-foreground">Nexus</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">Sign in</h2>
            <p className="text-muted text-[14px]">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-[12px] font-medium text-emerald-500 hover:text-emerald-600 transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full h-11 pl-10 pr-12 rounded-xl border border-border bg-card text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="remember"
                className="w-4 h-4 rounded border-border bg-card accent-emerald-500"
              />
              <label htmlFor="remember" className="text-[13px] text-muted">
                Remember me for 30 days
              </label>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 text-[13px] font-medium flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-500 text-white font-semibold text-[14px] hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>

            <p className="text-center text-[13px] text-muted pt-2">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-emerald-500 hover:text-emerald-600 transition">
                Sign up
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}