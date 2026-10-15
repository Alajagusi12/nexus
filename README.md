```markdown
<div align="center">

# Nexus

**Your team's all-in-one workspace.**

Chat · Video calls · Documents · Tasks · Analytics

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io)

[**Live Demo**](https://nexus-iota-two-17.vercel.app) · [Report Bug](https://github.com/Alajagusi12/nexus/issues)

</div>

---

## What is Nexus?

Nexus is a full-stack team collaboration platform that combines messaging, video calls, documents, and tasks into one workspace.

Most teams pay for 5 tools and juggle 5 browser tabs. Nexus replaces them all.

---

## Features

### 💬 Real-time messaging
Direct messages and group chats. Threads and replies. Message editing, deletion, reactions. Read receipts, typing indicators, presence. File sharing. Message search and pinning. 60+ emoji picker.

### 📹 Video & voice calls
One-click WebRTC calls. No plugins, no downloads. TURN servers for NAT traversal. Incoming call popup.

### 📝 Collaborative documents
Rich-text editor (Tiptap). Autosave. Word count and reading time.

### ✅ Kanban task boards
Drag-and-drop between columns. Priority levels, due dates. Create tasks directly from chat messages. Real-time updates.

### 🏢 Multi-workspace with roles
Users can belong to multiple workspaces. Role-based permissions (Owner, Admin, Member, Guest). Generate shareable invite links. Isolated data per workspace.

### 👥 Team directory
Skill tags (50+ skills across 6 categories). Filter members by skill. Online status and last-seen.

### 📊 Analytics dashboard
Message activity charts. Task completion rates. Top contributors. Recent activity feed.

### 🔔 Notifications
In-app notification center. Browser push notifications (Web Push + Service Worker).

### 🎨 Polish
Dark and light themes. Fully responsive. Command palette (Ctrl+K). Framer Motion animations. Toast notifications.

---

## Screenshots

### Dashboard
![Dashboard](./public/dashboard.png)

### Chat
![Chat](./public/chat.png)

### Tasks
![Tasks](./public/tasks.png)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Auth | NextAuth v5 (Credentials + bcrypt) |
| Realtime | Supabase Realtime |
| Video | WebRTC + TURN |
| Editor | Tiptap |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide |
| Notifications | Web Push + VAPID |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

Node.js 20+, a PostgreSQL database (Supabase recommended), npm or yarn.

### Installation

```bash
git clone https://github.com/Alajagusi12/nexus.git
cd nexus
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Open http://localhost:3000.

Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:port/database"
AUTH_SECRET="your-32-char-secret"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_TURN_URL="turn:your-turn-server.com:80"
NEXT_PUBLIC_TURN_USERNAME="username"
NEXT_PUBLIC_TURN_CREDENTIAL="password"
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
```

Generate VAPID keys with: npx web-push generate-vapid-keys

---

Project Structure

```
nexus/
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── invite/[token]/
│   ├── components/
│   └── lib/
└── package.json
```

---

Known Limitations

· File uploads are stored as base64 in Postgres (migration to object storage planned)
· Group video calls are not yet supported (1-on-1 only)
· Email notifications not yet implemented (in-app + browser push only)
· Password reset uses demo mode (link shown on screen instead of emailed)

---

Roadmap

□ File storage via Supabase Storage or UploadThing
□ Group video calls
□ Screen sharing
□ Email notifications (Resend)
□ Universal search
□ AI assistant
□ Calendar view
□ Audit log

---

Author

Teslim Alajagusi

· GitHub: @Alajagusi12
· Live: nexus-iota-two-17.vercel.app

---

License

MIT License

Copyright (c) 2026 Teslim Alajagusi

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```
```