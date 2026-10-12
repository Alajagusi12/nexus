import Link from "next/link";

export default function HomePage() {
  const features = [
    { emoji: "💬", title: "Real-time Chat", desc: "Instant messaging with channels, DMs, and threads." },
    { emoji: "📹", title: "Video Calls", desc: "Crystal-clear calls with screen sharing built in." },
    { emoji: "📝", title: "Live Documents", desc: "Collaborate on docs with live cursors and comments." },
    { emoji: "✅", title: "Task Boards", desc: "Kanban boards that update in real time for your team." },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tight">Nexus</div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md px-4 py-2 text-sm bg-white text-slate-900 hover:bg-slate-200 transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto text-center px-6 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Now in beta — Join free
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Your team&apos;s
          <br />
          all-in-one workspace
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Chat, video call, edit documents, and manage tasks — all in one place.
          Built for teams that move fast.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="rounded-md px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 transition font-semibold"
          >
            Start for free →
          </Link>
          <Link
            href="#features"
            className="rounded-md px-6 py-3 border border-white/20 text-white hover:bg-white/10 transition font-semibold"
          >
            See features
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Everything your team needs
        </h2>
        <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
          Stop paying for five different tools. Nexus brings it all together.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl mb-4">{f.emoji}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to get started?
        </h2>
        <p className="text-slate-400 mb-10 text-lg">
          Free forever for small teams. No credit card required.
        </p>
        <Link
          href="/register"
          className="rounded-md px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 transition font-semibold"
        >
          Create your workspace →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Nexus. Built with Next.js.
      </footer>
    </main>
  );
}