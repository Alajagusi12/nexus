import Link from "next/link";
import {
  MessageSquare,
  Video,
  FileText,
  CheckSquare,
  Users,
  Bell,
  ArrowRight,
  Check,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0F1E] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0F1E]/80 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              N
            </div>
            <span className="text-base font-semibold tracking-tight">
              Nexus
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <Link href="#features" className="hover:text-white transition">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-white transition">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm text-slate-300 hover:text-white transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm rounded-lg px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 transition font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-5 md:px-6 pt-16 md:pt-24 pb-12 md:pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Now in beta — Free to try
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
          <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Your team&apos;s
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            all-in-one workspace
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Chat, call, write, and plan — in one place. No more juggling five
          tools and five tabs.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
          <Link
            href="/register"
            className="w-full sm:w-auto group rounded-lg px-6 py-3 bg-blue-600 hover:bg-blue-500 transition font-medium flex items-center justify-center gap-2 text-sm"
          >
            Start for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto rounded-lg px-6 py-3 border border-white/[0.08] text-slate-200 hover:bg-white/[0.03] transition font-medium text-sm text-center"
          >
            See features
          </Link>
        </div>

        {/* Product preview */}
        <div className="relative max-w-4xl mx-auto mt-16 md:mt-20">
          <div className="absolute inset-x-0 -top-8 h-24 bg-gradient-to-b from-blue-500/15 to-transparent blur-3xl" />
          <div className="relative rounded-xl border border-white/[0.08] bg-[#0F1425] p-1.5 shadow-2xl">
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/[0.06]">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="ml-3 text-[10px] text-slate-500 font-mono">
                nexus.app/dashboard
              </div>
            </div>
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-[#0A0F1E] flex items-center justify-center">
              <p className="text-slate-600 text-xs md:text-sm">
                Screenshot coming soon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-5 md:px-6 py-20 md:py-28"
      >
        <div className="max-w-xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Everything you need
          </h2>
          <p className="text-slate-400 text-base">
            One workspace. Six tools replaced.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {[
            {
              icon: MessageSquare,
              title: "Chat",
              desc: "DMs, groups, and threads with instant delivery.",
            },
            {
              icon: Video,
              title: "Video calls",
              desc: "One-click WebRTC. No plugins, no downloads.",
            },
            {
              icon: FileText,
              title: "Documents",
              desc: "Rich-text editor with autosave and history.",
            },
            {
              icon: CheckSquare,
              title: "Task boards",
              desc: "Kanban with drag-and-drop and live sync.",
            },
            {
              icon: Users,
              title: "Team directory",
              desc: "See who does what. Match people to projects.",
            },
            {
              icon: Bell,
              title: "Notifications",
              desc: "Push alerts when it matters. Quiet when it doesn't.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group bg-[#0A0F1E] p-6 md:p-8 hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-colors">
                <f.icon className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="max-w-6xl mx-auto px-5 md:px-6 pb-20 md:pb-28"
      >
        <div className="max-w-xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Simple pricing
          </h2>
          <p className="text-slate-400 text-base">
            Free during beta. Paid plans coming later.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              period: "forever",
              features: [
                "Unlimited messages",
                "Group chats & threads",
                "Video & voice calls",
                "Task boards",
                "Documents",
                "Up to 10 members",
              ],
              cta: "Get started",
              highlight: false,
            },
            {
              name: "Pro",
              price: "$12",
              period: "/ month per user",
              features: [
                "Everything in Free",
                "Unlimited members",
                "Advanced analytics",
                "Priority support",
                "Custom branding",
              ],
              cta: "Coming soon",
              highlight: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              period: "",
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
                  ? "border-blue-500/30 bg-gradient-to-b from-blue-500/[0.06] to-transparent"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-3xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-xs text-slate-500">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-slate-400"
                  >
                    <Check
                      className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        plan.highlight ? "text-blue-400" : "text-slate-600"
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.highlight ? "/register" : "#"}
                className={`block text-center rounded-lg py-2.5 font-medium text-sm transition ${
                  plan.highlight
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "border border-white/[0.08] hover:bg-white/[0.03] text-slate-300"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 md:px-6 pb-20 md:pb-28">
        <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-10 md:p-14 text-center overflow-hidden">
          <div className="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              Ready to try it?
            </h2>
            <p className="text-slate-400 text-sm md:text-base mb-7 max-w-md mx-auto">
              Takes 30 seconds. No credit card needed.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 bg-blue-600 hover:bg-blue-500 transition font-medium text-sm"
            >
              Create your workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-[10px]">
                N
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Nexus
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500">
              <Link
                href="#features"
                className="hover:text-slate-300 transition"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="hover:text-slate-300 transition"
              >
                Pricing
              </Link>
              <Link href="/login" className="hover:text-slate-300 transition">
                Sign in
              </Link>
            </div>

            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} Nexus
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}