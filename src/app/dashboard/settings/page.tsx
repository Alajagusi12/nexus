"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { usePush } from "@/lib/use-push";
import {
  User,
  Lock,
  Loader2,
  Check,
  Upload,
  Trash2,
  Sparkles,
  Bell,
  BellOff,
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

  const [form, setForm] = useState({
    name: "",
    bio: "",
    image: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsMessage, setSkillsMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch("/api/users/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          bio: data.bio || "",
          image: data.image || "",
        });
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: result.url }),
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "" }),
      });
      setSavedMessage("Avatar removed");
      setTimeout(() => setSavedMessage(""), 3000);
      update();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError("Failed to save");
        setSaving(false);
        return;
      }

      setSavedMessage("Profile updated!");
      setTimeout(() => setSavedMessage(""), 3000);
      update();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSkills() {
    setSavingSkills(true);
    setSkillsMessage("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      if (!res.ok) {
        setSkillsMessage("Failed to save skills");
        setTimeout(() => setSkillsMessage(""), 3000);
        return;
      }
      setSkillsMessage("Skills updated!");
      setTimeout(() => setSkillsMessage(""), 3000);
    } catch (err) {
      setSkillsMessage("Something went wrong");
    } finally {
      setSavingSkills(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed");
        setChangingPassword(false);
        return;
      }

      setPasswordMessage("Password changed!");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) {
      setPasswordError("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted text-sm md:text-base">
          Manage your account and preferences
        </p>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden ring-4 ring-border/30 flex-shrink-0">
          {form.image ? (
            <img
              src={form.image}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            form.name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold truncate">
            {form.name || session?.user?.name}
          </p>
          <p className="text-sm text-muted truncate mb-3">
            {session?.user?.email}
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-medium transition cursor-pointer">
              <Upload className="w-3 h-3" />
              Upload photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
            {form.image && (
              <button
                type="button"
                onClick={removeAvatar}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-medium transition"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 text-sm mb-6">
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-2.5 text-sm flex items-center gap-2 mb-6">
          <Check className="w-4 h-4" />
          {savedMessage}
        </div>
      )}

      <motion.form
        onSubmit={handleSave}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 md:p-6 mb-6 space-y-5"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h2>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            placeholder="Tell us about yourself"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 md:p-6 mb-6"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        <p className="text-sm text-muted mb-4">
          Get desktop alerts when someone sends you a message, even when this
          tab is in the background.
        </p>

        {!push.supported ? (
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-4 py-2.5 text-sm">
            Your browser doesn&apos;t support push notifications.
          </div>
        ) : push.permission === "denied" ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 text-sm">
            Notifications blocked. Enable them in your browser settings (click
            the lock icon in the URL bar).
          </div>
        ) : (
          <button
            type="button"
            onClick={push.subscribed ? push.unsubscribe : push.subscribe}
            disabled={push.loading}
            className={`rounded-xl px-5 py-2.5 font-semibold transition flex items-center gap-2 disabled:opacity-50 ${
              push.subscribed
                ? "bg-foreground/5 hover:bg-foreground/10 border border-border"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
            }`}
          >
            {push.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Working...
              </>
            ) : push.subscribed ? (
              <>
                <BellOff className="w-4 h-4" />
                Disable notifications
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Enable notifications
              </>
            )}
          </button>
        )}

        {push.subscribed && (
          <p className="text-xs text-green-500 mt-3 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Notifications enabled on this device
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 md:p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Skills
          </h2>
          {skillsMessage && (
            <span
              className={`text-xs font-medium ${
                skillsMessage.includes("updated")
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {skillsMessage}
            </span>
          )}
        </div>

        <p className="text-sm text-muted mb-4">
          Pick the skills you bring to the team. They show up on your profile
          and the Team page.
        </p>

        <SkillPicker selected={skills} onChange={setSkills} />

        <button
          type="button"
          onClick={handleSaveSkills}
          disabled={savingSkills}
          className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingSkills ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save skills"
          )}
        </button>
      </motion.div>

      <motion.form
        onSubmit={handlePasswordChange}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 md:p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h2>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80">
            Current password
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })
            }
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80">
            New password
          </label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value,
              })
            }
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {passwordError && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 text-sm">
            {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-2.5 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            {passwordMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={changingPassword}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 flex items-center gap-2"
        >
          {changingPassword ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Changing...
            </>
          ) : (
            "Change password"
          )}
        </button>
      </motion.form>
    </div>
  );
}