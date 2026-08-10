"use client";

import { useState } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-KW", { year: "numeric", month: "long", day: "numeric" });
}

export default function TopicsSection({ topics }) {
  const [activePdf, setActivePdf] = useState(null);

  return (
    <section className="section" id="topics">
      <div className="container">
        <div className="section-head reveal">
          <span className="tag">مواضيع الأعضاء</span>
          <h2>مواضيع ومقالات الأعضاء</h2>
          <p>محتوى معرفي ومرفقات يشاركها أعضاء إيليت مع الزوّار</p>
        </div>

        {topics.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px 0" }}>
            ما فيه مواضيع منشورة حالياً.
          </p>
        ) : (
          <div className="topics-grid">
            {topics.map((topic) => (
              <article className="topic-card reveal" key={topic.id}>
                <div className="topic-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                  </svg>
                </div>
                <h3 className="topic-title">{topic.title}</h3>
                <div className="topic-meta">
                  <span className="topic-author">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.3 0-8 2.7-8 4v1h16v-1c0-1.3-2.7-4-8-4Z" />
                    </svg>
                    {topic.author_name}
                  </span>
                  <span className="topic-date">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                      <path d="M8 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3V2h-2v2H9V2H8Zm-3 6h14v12H5V8Zm7 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
                    </svg>
                    {formatDate(topic.published_at)}
                  </span>
                </div>
                <button
                  className="btn btn-primary topic-read-btn"
                  onClick={() => setActivePdf(topic.pdf_url)}
                >
                  اقرأ الموضوع
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {activePdf && (
        <div
          className="pdf-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setActivePdf(null); }}
        >
          <div className="pdf-modal">
            <div className="pdf-modal-header">
              <span>عارض PDF</span>
              <button className="pdf-close" onClick={() => setActivePdf(null)} aria-label="إغلاق">
                ✕
              </button>
            </div>
            <iframe
              src={activePdf}
              title="عارض الموضوع"
              className="pdf-frame"
            />
          </div>
        </div>
      )}
    </section>
  );
}
