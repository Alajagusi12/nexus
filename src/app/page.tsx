"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, Video, FileText, CheckSquare, Users, Bell, ArrowRight,
  Check, Zap, Sparkles, LayoutDashboard, Shield, Command, Play, CheckCircle2
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* ===================== NAVBAR ===================== */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-5 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Nexus
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-muted">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">
                Open Workspace <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-[13px] font-semibold text-muted hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition shadow-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative max-w-6xl mx-auto px-5 md:px-6 pt-24 md:pt-32 pb-16 text-center">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Nexus 2.0 is now live
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              Your team&apos;s
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              all-in-one workspace
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Chat, plan, and write in one place. Nexus combines real-time messaging, Kanban boards, and documents into a single, blazing-fast interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
            <Link href={session ? "/dashboard" : "/register"} className="w-full sm:w-auto group rounded-xl px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 transition shadow-xl shadow-emerald-500/20 font-semibold flex items-center justify-center gap-2 text-[14px] text-white">
              Start for free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto rounded-xl px-7 py-3.5 border border-border text-foreground hover:bg-foreground/[0.04] transition font-semibold text-[14px] flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> Explore features
            </Link>
          </div>
        </motion.div>

        {/* Legendary Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="relative max-w-5xl mx-auto mt-16 md:mt-24"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 h-full w-full pointer-events-none" />
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 shadow-2xl overflow-hidden">
            <div className="rounded-xl border border-border bg-background overflow-hidden relative">
              {/* Fake Browser Header */}
              <div className="h-10 border-b border-border flex items-center px-4 gap-2 bg-foreground/[0.02]">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <div className="ml-4 flex-1 max-w-xs h-6 rounded-md bg-foreground/[0.04] border border-border flex items-center px-2 text-[10px] text-muted font-mono">
                  nexus.app/dashboard
                </div>
              </div>
              {/* CSS-Only Dashboard Mockup */}
              <div className="aspect-[16/9] bg-background p-4 md:p-8 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-6 w-32 bg-foreground/10 rounded" />
                  <div className="h-8 w-24 bg-emerald-500/20 rounded-lg" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 rounded-xl border border-border bg-card p-3 flex flex-col justify-between">
                      <div className="h-6 w-6 rounded bg-foreground/5" />
                      <div className="h-4 w-12 bg-foreground/10 rounded" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div className="col-span-2 rounded-xl border border-border bg-card p-4">
                    <div className="h-4 w-24 bg-foreground/10 rounded mb-4" />
                    <div className="space-y-2">
                      <div className="h-10 rounded bg-foreground/5" />
                      <div className="h-10 rounded bg-foreground/5" />
                      <div className="h-10 rounded bg-foreground/5" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="h-4 w-20 bg-foreground/10 rounded mb-4" />
                    <div className="h-32 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 mx-auto w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===================== SOCIAL PROOF ===================== */}
      <section className="border-y border-border/40 bg-foreground/[0.01] py-10">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-6">Trusted by fast-moving teams</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
            <div className="flex items-center gap-2 font-bold text-lg"><Zap className="w-5 h-5" /> Acme Corp</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Shield className="w-5 h-5" /> Vanguard</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Command className="w-5 h-5" /> Linear</div>
            <div className="flex items-center gap-2 font-bold text-lg"><LayoutDashboard className="w-5 h-5" /> Stripe</div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="max-w-6xl mx-auto px-5 md:px-6 py-24">
        <div className="max-w-xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need. Nothing you don&apos;t.</h2>
          <p className="text-muted text-[15px]">We replaced 5 different subscriptions with one unified workspace.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: MessageSquare, title: "Real-time Chat", desc: "Lightning fast messaging with threads, mentions, and reactions.", color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: Video, title: "Group Calls", desc: "Start a video or voice call directly from a chat, powered by LiveKit.", color: "text-purple-500", bg: "bg-purple-500/10" },
            { icon: FileText, title: "Collaborative Docs", desc: "A rich-text editor with slash commands, focus mode, and Markdown export.", color: "text-pink-500", bg: "bg-pink-500/10" },
            { icon: CheckSquare, title: "Kanban Tasks", desc: "Drag-and-drop task management with subtasks, comments, and priorities.", color: "text-orange-500", bg: "bg-orange-500/10" },
            { icon: Users, title: "Multi-Tenant", desc: "Create multiple workspaces, invite members, and manage RBAC roles.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: Bell, title: "Notifications", desc: "Push alerts when it matters. Quiet when it doesn't.", color: "text-yellow-500", bg: "bg-yellow-500/10" },
          ].map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/30 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${f.bg} ${f.color} group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-bold mb-2 text-foreground">{f.title}</h3>
              <p className="text-[13.5px] text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 md:px-6 pb-24">
        <div className="max-w-xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple pricing</h2>
          <p className="text-muted text-[15px]">Free during beta. Paid plans coming later.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { name: "Free", price: "$0", period: "forever", features: ["Unlimited messages", "Group chats & threads", "Task boards", "Documents", "Up to 10 members"], cta: "Get started", highlight: false },
            { name: "Pro", price: "$12", period: "/ month", features: ["Everything in Free", "Unlimited members", "Advanced analytics", "Priority support", "Custom branding"], cta: "Coming soon", highlight: true },
            { name: "Enterprise", price: "Custom", period: "", features: ["Everything in Pro", "SSO / SAML", "Audit logs", "Dedicated support", "Custom SLA"], cta: "Contact us", highlight: false },
          ].map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl border p-6 ${plan.highlight ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.05] to-transparent shadow-lg shadow-emerald-500/5" : "border-border bg-card"}`}>
              <div className="mb-6">
                <h3 className="text-[15px] font-bold mb-1 text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-3xl font-bold tracking-tight text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-[12px] font-medium text-muted">{plan.period}</span>}
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-muted">
                    <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-emerald-500" : "text-muted/50"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.highlight ? "/register" : "#"} className={`block text-center rounded-xl py-2.5 font-semibold text-[13px] transition ${plan.highlight ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "border border-border hover:bg-foreground/[0.04] text-foreground"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="max-w-6xl mx-auto px-5 md:px-6 pb-24">
        <div className="relative rounded-3xl border border-border/50 bg-gradient-to-b from-emerald-500/[0.05] to-transparent p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">Ready to upgrade your workflow?</h2>
            <p className="text-muted text-[15px] mb-8 max-w-md mx-auto">Takes 30 seconds. No credit card needed.</p>
            <Link href={session ? "/dashboard" : "/register"} className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 transition shadow-xl shadow-emerald-500/20 font-semibold text-white text-[14px]">
              Create your workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="mt-6 flex items-center justify-center gap-6 text-[12px] text-muted font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-border/40 bg-background">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Nexus</span>
          </div>
          <div className="flex items-center gap-6 text-[12.5px] font-medium text-muted">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
          <p className="text-[12px] text-muted">© {new Date().getFullYear()} Nexus. Built by Teslim.</p>
        </div>
      </footer>
    </div>
  );
}