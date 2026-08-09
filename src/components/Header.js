"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(undefined); // undefined = still checking, null = logged out
  const [canReview, setCanReview] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManageTopics, setCanManageTopics] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role, can_approve_trainers, can_manage_member_topics")
          .eq("id", data.user.id)
          .single();
        setCanReview(profile?.role === "admin" || profile?.can_approve_trainers === true);
        setIsAdmin(profile?.role === "admin");
        setCanManageTopics(profile?.role === "admin" || profile?.can_manage_member_topics === true);
      } else {
        setCanReview(false);
        setIsAdmin(false);
        setCanManageTopics(false);
      }
    }
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setCanReview(false);
        setIsAdmin(false);
        setCanManageTopics(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  return (
    <header className="site-header" id="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="ELITE Logo" className="brand-logo" />
          <span className="brand-text">
            <strong data-ar="إيليت" data-en="ELITE">
              إيليت
            </strong>
            <small
              data-ar="للأبحاث التجريبية والتطوير في علم النفس"
              data-en="Research &amp; Development in Psychology"
            >
              للأبحاث التجريبية والتطوير في علم النفس
            </small>
          </span>
        </Link>

        <nav className="main-nav" id="main-nav">
          <ul>
            <li>
              <a href="/#home" className="nav-link" data-ar="الرئيسية" data-en="Home">
                الرئيسية
              </a>
            </li>
            <li>
              <a href="/#about" className="nav-link" data-ar="عن إيليت" data-en="About">
                عن إيليت
              </a>
            </li>
            <li className="nav-desktop-hidden">
              <a href="/#team" className="nav-link" data-ar="الأعضاء" data-en="Members">
                الأعضاء
              </a>
            </li>
            <li>
              <a href="/#courses" className="nav-link" data-ar="الدورات" data-en="Courses">
                الدورات
              </a>
            </li>
            <li className="nav-desktop-hidden">
              <a href="/#cpd" className="nav-link" data-ar="الاعتماد المهني" data-en="CPD">
                الاعتماد المهني
              </a>
            </li>
            <li>
              <a href="/#events" className="nav-link" data-ar="الفعاليات" data-en="Events">
                الفعاليات
              </a>
            </li>
            <li>
              <a href="/#podcast" className="nav-link" data-ar="استبصار" data-en="Estibsar">
                استبصار
              </a>
            </li>
            <li className="nav-desktop-hidden">
              <a href="/#blog" className="nav-link" data-ar="المدونة" data-en="Blog">
                المدونة
              </a>
            </li>
            <li>
              <a href="/#contact" className="nav-link" data-ar="تواصل معنا" data-en="Contact">
                تواصل معنا
              </a>
            </li>
            <li className="nav-desktop-hidden">
              <Link href="/topics" className="nav-link">
                مواضيع الأعضاء
              </Link>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          {user === undefined ? null : user ? (
            <>
              {isAdmin && (
                <Link href="/control-panel-2026" className="btn btn-outline login-btn">
                  لوحة الأدمن
                </Link>
              )}
              {canReview && (
                <Link href="/reviews/trainer-requests" className="btn btn-outline login-btn">
                  مراجعة الطلبات
                </Link>
              )}
              {canManageTopics && (
                <Link href="/manage/member-topics" className="btn btn-outline login-btn">
                  إدارة المواضيع
                </Link>
              )}
              <Link href="/dashboard" className="btn btn-outline login-btn">
                {displayName}
              </Link>
              <button
                type="button"
                className="btn btn-primary login-btn"
                onClick={handleLogout}
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary login-btn">
              تسجيل الدخول
            </Link>
          )}
          <button
            className="lang-switch"
            id="lang-switch"
            type="button"
            aria-label="Switch language"
          >
            <span id="lang-switch-label">EN</span>
          </button>
          <button
            className="hamburger"
            id="hamburger"
            type="button"
            aria-label="Menu"
            aria-expanded="false"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
