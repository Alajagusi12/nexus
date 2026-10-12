import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  Video,
  FileText,
  CheckSquare,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-blue-500/15 via-purple-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1020]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              N
            </div>
            <span className="text-lg font-bold tracking-tight">Nexus</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <Link href="#features" className="hover:text-white transition">Features</Link>
            <Link href="#how" className="hover:text-white transition">How it works</Link>
            <Link href="#pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition">FAQ</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-sm text-slate-300 hover:text-white transition">
              Sign in
            </Link>
            <Link href="/register" className="rounded-lg px-4 py-2 text-sm bg-white text-slate-900 hover:bg-slate-100 transition font-semibold flex items-center gap-1.5 group">
              Get started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 md:pt-28 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-1.5 text-xs text-slate-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Now in beta — Free during beta
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
          <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
            The workspace
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            your team deserves
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Chat, video calls, documents, and tasks. All in one place. Built for
          teams that ship fast and hate tool-switching.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
          <Link href="/register" className="group rounded-xl px-6 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25">
            Start building free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
          <Link href="#how" className="rounded-xl px-6 py-3.5 border border-white/10 text-slate-200 hover:bg-white/5 transition font-semibold">
            See how it works
          </Link>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent blur-2xl -z-10" />
          <div className="rounded-2xl border border-white/10 bg-[#0F1424] p-2 shadow-2xl shadow-blue-500/10">
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <div className="ml-3 text-[10px] text-slate-500 font-mono">
                nexus.app/dashboard
              </div>
            </div>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#0B1020] flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-slate-500 text-sm">
                  Add your dashboard screenshot to <code className="text-blue-400">public/dashboard.png</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack bar (replacing fake logos) */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-y border-white/5">
        <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-8">
          Built with
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center opacity-50">
          {[
            "Next.js 16",
            "TypeScript",
            "Prisma",
            "PostgreSQL",
            "Supabase",
          ].map((name) => (
            <div
              key={name}
              className="text-center text-sm font-semibold tracking-tight text-slate-300"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Everything in one place
          </h2>
          <p className="text-slate-400 text-lg">
            Stop paying for five tools. Nexus replaces all of them.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: MessageSquare,
              title: "Real-time chat",
              desc: "DMs, groups, threads, reactions, file sharing. Everything you need to talk.",
              color: "from-blue-500 to-blue-600",
            },
            {
              icon: Video,
              title: "Video & voice calls",
              desc: "One-click WebRTC calls. No plugins, no downloads, no accounts.",
              color: "from-purple-500 to-purple-600",
            },
            {
              icon: FileText,
              title: "Collaborative docs",
              desc: "Rich-text editor with autosave. Write together, in real time.",
              color: "from-pink-500 to-pink-600",
            },
            {
              icon: CheckSquare,
              title: "Kanban task boards",
              desc: "Drag-and-drop tasks with priorities, due dates, and live updates.",
              color: "from-green-500 to-green-600",
            },
            {
              icon: Users,
              title: "Team & skills",
              desc: "See who knows what. Match tasks to skills. Build better teams.",
              color: "from-orange-500 to-orange-600",
            },
            {
              icon: Sparkles,
              title: "Smart notifications",
              desc: "Push alerts, pinned messages, and an activity feed — all in one.",
              color: "from-yellow-500 to-yellow-600",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product tour */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-24 space-y-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 mb-6">
              <MessageSquare className="w-3 h-3" />
              Chat
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Conversations that actually flow
            </h3>
            <p className="text-slate-400 text-lg mb-6 leading-relaxed">
              Real-time messaging with typing indicators, read receipts, message
              editing, threads, and file sharing. It just works.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                "Instant delivery via WebSockets",
                "Edit, delete, react, pin — all the essentials",
                "Threads for keeping big conversations focused",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0F1424] p-2 shadow-xl">
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#0B1020] flex items-center justify-center">
              <p className="text-slate-500 text-sm p-4 text-center">
                Add <code className="text-blue-400">public/chat.png</code>
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-[#0F1424] p-2 shadow-xl">
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#0B1020] flex items-center justify-center">
              <p className="text-slate-500 text-sm p-4 text-center">
                Add <code className="text-green-400">public/tasks.png</code>
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 mb-6">
              <CheckSquare className="w-3 h-3" />
              Tasks
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ship work, not status updates
            </h3>
            <p className="text-slate-400 text-lg mb-6 leading-relaxed">
              Kanban boards that everyone can actually see. Drag tasks between
              columns. Assign priorities. Hit deadlines.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                "Drag-and-drop between 4 status columns",
                "Priority levels and due dates",
                "Live sync — changes appear instantly for everyone",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Real stats */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10+", label: "Core features" },
              { value: "WebRTC", label: "Video calls" },
              { value: "PostgreSQL", label: "Database" },
              { value: "$0", label: "During beta" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-1">
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Simple pricing
          </h2>
          <p className="text-slate-400 text-lg">
            Free during beta. Paid plans coming soon.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "$0",
              period: "forever",
              desc: "For individuals and small teams",
              features: [
                "Unlimited messages",
                "Group chats & threads",
                "Video & voice calls",
                "Task boards",
                "Rich-text documents",
                "Up to 10 team members",
              ],
              cta: "Start free",
              highlight: true,
            },
            {
              name: "Pro",
              price: "$12",
              period: "per user / month",
              desc: "For growing teams",
              features: [
                "Everything in Free",
                "Unlimited team members",
                "Advanced analytics",
                "Priority support",
                "Custom branding",
              ],
              cta: "Coming soon",
              highlight: false,
            },
            {
              name: "Enterprise",
              price: "Custom",
              period: "",
              desc: "For organizations",
              features: [
                "Everything in Pro",
                "SSO / SAML",
                "Audit logs",
                "Dedicated support",
                "Custom SLA",
              ],
              cta: "Contact us",
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-blue-500/40 bg-gradient-to-b from-blue-500/10 to-transparent"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[10px] font-bold uppercase tracking-wider">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  )}
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-blue-400" : "text-slate-500"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.highlight ? "/register" : "#"}
                className={`block text-center rounded-xl py-2.5 font-semibold text-sm transition ${
                  plan.highlight
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white"
                    : "border border-white/10 hover:bg-white/5 text-slate-300"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Questions?
          </h2>
          <p className="text-slate-400">Everything you need to know.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Is Nexus really free?",
              a: "Yes. While we're in beta, every feature is free. No credit card, no trial period. We'll introduce paid plans later, but early users keep access to the free tier.",
            },
            {
              q: "What makes Nexus different from Slack or Notion?",
              a: "It combines the best of both — plus video calls, task boards, and analytics. One tool, one bill, one login. No more juggling five browser tabs.",
            },
            {
              q: "Do I need to install anything?",
              a: "No. Nexus runs entirely in your browser. Video calls use WebRTC, so there are no plugins or downloads required.",
            },
            {
              q: "Is my data secure?",
              a: "Yes. All data is encrypted in transit and at rest. We use industry-standard authentication and never sell your data.",
            },
            {
              q: "Can I use Nexus with my existing team?",
              a: "Absolutely. Invite anyone with a link. No per-seat pricing during beta — add as many members as you need.",
            },
            {
              q: "What if I need help?",
              a: "We're a small team, and we respond fast. Reach out via the chat inside the app — we usually reply within hours.",
            },
          ].map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.03] transition list-none">
                <span className="font-medium pr-4">{item.q}</span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-slate-400 group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to try it?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join the beta. It takes 30 seconds and there&apos;s nothing to pay.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition font-semibold shadow-lg shadow-blue-500/25 group"
            >
              Create your workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                  N
                </div>
                <span className="text-base font-bold tracking-tight">Nexus</span>
              </Link>
              <p className="text-sm text-slate-500 max-w-sm">
                The all-in-one workspace for teams that move fast. Chat, calls,
                docs, and tasks — together at last.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Product
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-white transition">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Account
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/login" className="hover:text-white transition">Sign in</Link></li>
                <li><Link href="/register" className="hover:text-white transition">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Nexus. Built with Next.js, Prisma, and Supabase.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Secure</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Fast</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Global</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}