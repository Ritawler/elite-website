"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get("error");
    if (callbackError) {
      setError(`خطأ من عملية تسجيل الدخول: ${callbackError}`);
    }
  }, []);

  async function goToDashboard(userId) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, role_selected")
      .eq("id", userId)
      .single();

    // Auto-assign student for users who haven't gone through role selection
    if (!profile?.role_selected) {
      await supabase
        .from("users")
        .update({ role: "student", role_selected: true })
        .eq("id", userId);
      router.push("/dashboard/student");
      return;
    }

    if (profile.role === "admin") { router.push("/control-panel-2026"); return; }
    router.push(`/dashboard/${profile.role}`);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setLoading(false);
      return;
    }

    await goToDashboard(data.user.id);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "student", phone },
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered") ||
          error.message.includes("already been registered")
          ? "هذا البريد الإلكتروني مسجّل مسبقاً."
          : "تعذّر إنشاء الحساب. حاول مرة أخرى."
      );
      setLoading(false);
      return;
    }

    // Save phone number to users table (column must exist — see SQL below)
    if (data.user && phone) {
      await supabase
        .from("users")
        .update({ phone, role: "student", role_selected: true })
        .eq("id", data.user.id);
    }

    if (data.session) {
      await goToDashboard(data.user.id);
      return;
    }

    setSuccess("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.");
    setLoading(false);
  }

  async function handleGoogle() {
    setError("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>مرحباً بك في إيليت</h1>
        <p className="auth-subtitle">سجّل دخولك أو أنشئ حساباً جديداً للمتابعة</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
          >
            إنشاء حساب
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="auth-field">
              <label htmlFor="fullName">الاسم الكامل</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="reg-email">البريد الإلكتروني</label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="reg-phone">رقم الهاتف</label>
              <input
                id="reg-phone"
                type="tel"
                required
                placeholder="مثال: 96512345678+"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="reg-password">كلمة المرور</label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "جارٍ الإنشاء..." : "إنشاء حساب"}
            </button>
          </form>
        )}

        <div className="auth-divider">أو</div>

        <button type="button" className="btn btn-outline google-btn" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.98v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.69 9c0-.6.1-1.18.28-1.71V4.96H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.04l2.99-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.96l2.99 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          المتابعة عبر Google
        </button>
      </div>
    </div>
  );
}
