"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { usePush } from "@/lib/use-push";
import {
  User, Lock, Loader2, Check, Upload, Trash2, Sparkles,
  Bell, BellOff, Mail, ShieldCheck, AlertCircle
} from "lucide-react";
import { SkillPicker } from "@/components/skill-picker";
import { parseSkills } from "@/lib/skills";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const push = usePush();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", bio: "", image: "" });
  const [skills, setSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsMessage, setSkillsMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch("/api/users/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setForm({ name: data.name || "", bio: data.bio || "", image: data.image || "" });
        setSkills(parseSkills(data.skills));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large. Max 5MB.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setError("");
    try {
      const { uploadFile } = await import("@/lib/storage");
      const result = await uploadFile(file, "avatars", "user-avatars");

      if (result.error) {
        setError("Failed to upload: " + result.error);
        setTimeout(() => setError(""), 4000);
        return;
      }

      setForm({ ...form, image: result.url });
      const res = await fetch("/api/users/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: result.url }),
      });

      if (res.ok) {
        setSavedMessage("Avatar updated!");
        setTimeout(() => setSavedMessage(""), 3000);
        update();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to upload avatar");
    }
    e.target.value = "";
  }

  async function removeAvatar() {
    setForm({ ...form, image: "" });
    try {
      await fetch("/api/users/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: "" }),
      });
      setSavedMessage("Avatar removed");
      setTimeout(() => setSavedMessage(""), 3000);
      update();
    } catch (err) { console.error(err); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSavedMessage("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) { setError("Failed to save"); setSaving(false); return; }
      setSavedMessage("Profile updated!");
      setTimeout(() => setSavedMessage(""), 3000);
      update();
    } catch (err) { setError("Something went wrong"); } 
    finally { setSaving(false); }
  }

  async function handleSaveSkills() {
    setSavingSkills(true); setSkillsMessage("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skills }),
      });
      if (!res.ok) { setSkillsMessage("Failed to save skills"); setTimeout(() => setSkillsMessage(""), 3000); return; }
      setSkillsMessage("Skills updated!");
      setTimeout(() => setSkillsMessage(""), 3000);
    } catch (err) { setSkillsMessage("Something went wrong"); } 
    finally { setSavingSkills(false); }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true); setPasswordError(""); setPasswordMessage("");

    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(passwordForm),
      });
      const data = await res.json();

      if (!res.ok) { setPasswordError(data.error || "Failed"); setChangingPassword(false); return; }
      setPasswordMessage("Password changed!");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) { setPasswordError("Something went wrong"); } 
    finally { setChangingPassword(false); }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 animate-pulse">
        <div className="h-8 w-48 bg-foreground/[0.05] rounded-lg mb-4" />
        <div className="h-4 w-64 bg-foreground/[0.05] rounded-lg mb-10" />
        <div className="h-32 bg-foreground/[0.02] border border-border rounded-2xl mb-6" />
        <div className="h-64 bg-foreground/[0.02] border border-border rounded-2xl mb-6" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 min-h-screen">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Account Settings</h1>
        <p className="text-[14px] text-muted">Manage your personal profile, security, and preferences.</p>
      </div>

      {/* ===================== PROFILE HERO ===================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl border border-border bg-gradient-to-br from-card to-background p-6 md:p-8 shadow-sm mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <User className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-3xl font-bold text-white overflow-hidden ring-4 ring-background shadow-xl">
              {form.image ? <img src={form.image} alt="avatar" className="w-full h-full object-cover" /> : form.name?.[0]?.toUpperCase() || "?"}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <Upload className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-2xl font-bold text-foreground mb-1 truncate">{form.name || session?.user?.name}</h2>
            <p className="text-[13px] text-muted flex items-center justify-center sm:justify-start gap-1.5 mb-4">
              <Mail className="w-3.5 h-3.5" /> {session?.user?.email}
            </p>
            {form.image && (
              <button onClick={removeAvatar} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[12px] font-semibold transition">
                <Trash2 className="w-3.5 h-3.5" /> Remove photo
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ===================== MESSAGES ===================== */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 text-[13px] font-medium mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}
        {savedMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 text-[13px] font-medium mb-6 flex items-center gap-2">
            <Check className="w-4 h-4" /> {savedMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== PROFILE FORM ===================== */}
      <motion.form onSubmit={handleSave} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6 mb-8 shadow-sm space-y-5">
        <h2 className="text-[16px] font-bold flex items-center gap-2 tracking-tight text-foreground mb-2">
          <User className="w-4 h-4 text-emerald-500" /> Profile Information
        </h2>

        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 text-muted">Full Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" placeholder="Your name" />
        </div>

        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 text-muted">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition resize-none" placeholder="Tell us about yourself..." />
        </div>

        <button type="submit" disabled={saving} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-white text-[13px] font-semibold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-2 shadow-sm">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Profile"}
        </button>
      </motion.form>

      {/* ===================== NOTIFICATIONS ===================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-6 mb-8 shadow-sm">
        <h2 className="text-[16px] font-bold flex items-center gap-2 tracking-tight text-foreground mb-2">
          <Bell className="w-4 h-4 text-emerald-500" /> Push Notifications
        </h2>
        <p className="text-[13px] text-muted mb-5">Get desktop alerts when someone sends you a message, even when this tab is in the background.</p>

        {!push.supported ? (
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-4 py-3 text-[13px] font-medium">Your browser doesn&apos;t support push notifications.</div>
        ) : push.permission === "denied" ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 text-[13px] font-medium">Notifications blocked. Enable them in your browser settings.</div>
        ) : (
          <button type="button" onClick={push.subscribed ? push.unsubscribe : push.subscribe} disabled={push.loading} className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition flex items-center gap-2 disabled:opacity-50 shadow-sm ${push.subscribed ? "bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground border border-border" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
            {push.loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Working...</> : push.subscribed ? <><BellOff className="w-4 h-4" /> Disable Notifications</> : <><Bell className="w-4 h-4" /> Enable Notifications</>}
          </button>
        )}

        {push.subscribed && (
          <p className="text-[12px] font-medium text-emerald-500 mt-4 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Notifications enabled on this device
          </p>
        )}
      </motion.div>

      {/* ===================== SKILLS ===================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[16px] font-bold flex items-center gap-2 tracking-tight text-foreground">
            <Sparkles className="w-4 h-4 text-emerald-500" /> Skills
          </h2>
          {skillsMessage && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${skillsMessage.includes("updated") ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>{skillsMessage}</span>
          )}
        </div>
        <p className="text-[13px] text-muted mb-5">Pick the skills you bring to the team. They show up on your profile and the Team page.</p>

        <SkillPicker selected={skills} onChange={setSkills} />

        <button type="button" onClick={handleSaveSkills} disabled={savingSkills} className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-white text-[13px] font-semibold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-2 shadow-sm">
          {savingSkills ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Skills"}
        </button>
      </motion.div>

      {/* ===================== PASSWORD ===================== */}
      <motion.form onSubmit={handlePasswordChange} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-[16px] font-bold flex items-center gap-2 tracking-tight text-foreground mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Security
        </h2>

        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 text-muted">Current Password</label>
          <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
        </div>

        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 text-muted">New Password</label>
          <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} className="w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
        </div>

        <AnimatePresence>
          {passwordError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 text-[13px] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {passwordError}
            </motion.div>
          )}
          {passwordMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 text-[13px] font-medium flex items-center gap-2">
              <Check className="w-4 h-4" /> {passwordMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={changingPassword} className="rounded-xl bg-foreground text-background px-5 py-2.5 text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 shadow-sm">
          {changingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</> : "Change Password"}
        </button>
      </motion.form>
    </div>
  );
}