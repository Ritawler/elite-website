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
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Surfaces errors that /auth/callback redirects back with (e.g. Google
  // sign-in failures) — temporary diagnostic, shows the raw message so we
  // can see exactly where the OAuth flow breaks.
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

    if (!profile?.role_selected) {
      router.push("/auth/select-role");
      return;
    }
    router.push(`/dashboard/${profile.role}`);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
        data: { full_name: fullName, role },
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
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
              setSuccess("");
            }}
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

            <div className="auth-field">
              <label>نوع الحساب</label>
              <div className="role-choice">
                <div
                  className={`role-option ${role === "student" ? "selected" : ""}`}
                  onClick={() => setRole("student")}
                >
                  متدرّب (Student)
                </div>
                <div
                  className={`role-option ${role === "trainer" ? "selected" : ""}`}
                  onClick={() => setRole("trainer")}
                >
                  مدرّب (Trainer)
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "جارٍ الإنشاء..." : "إنشاء حساب"}
            </button>
          </form>
        )}

        <div className="auth-divider">أو</div>

        <button type="button" className="btn btn-outline google-btn" onClick={handleGoogle}>
          المتابعة عبر Google
        </button>
      </div>
    </div>
  );
}
