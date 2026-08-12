"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [allData, setAllData] = useState({ courses: [], topics: [] });
  const [results, setResults] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  // Load search data once
  useEffect(() => {
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => {
        setAllData(data);
        setLoaded(true);
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(
    (q) => {
      if (!q.trim() || !loaded) {
        setResults([]);
        setSuggestion(null);
        return;
      }

      const courseItems = allData.courses.map((c) => ({
        ...c,
        _type: "course",
        _label: "دورة",
        _href: "/courses",
        _sub: c.description || "",
      }));
      const topicItems = allData.topics.map((t) => ({
        ...t,
        _type: "topic",
        _label: "موضوع",
        _href: "/#topics",
        _sub: t.author_name || "",
      }));
      const items = [...courseItems, ...topicItems];

      const fuse = new Fuse(items, {
        keys: ["title", "_sub"],
        threshold: 0.45,
        includeScore: true,
        minMatchCharLength: 2,
      });

      const matches = fuse.search(q);

      if (matches.length === 0) {
        // Try wider threshold for suggestion
        const fuzzy = new Fuse(items, {
          keys: ["title", "_sub"],
          threshold: 0.7,
          includeScore: true,
          minMatchCharLength: 1,
        });
        const fuzzyMatches = fuzzy.search(q);
        setSuggestion(fuzzyMatches[0]?.item?.title || null);
        setResults([]);
      } else {
        setSuggestion(null);
        setResults(matches.slice(0, 6).map((m) => m.item));
      }
    },
    [allData, loaded]
  );

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    search(q);
  }

  function handleSuggestionClick() {
    if (suggestion) {
      setQuery(suggestion);
      search(suggestion);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-wrap">
        <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
        </svg>
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          placeholder="ابحث عن دورة أو موضوع..."
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim() && setOpen(true)}
          aria-label="بحث"
          autoComplete="off"
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => { setQuery(""); setResults([]); setSuggestion(null); setOpen(false); }}
            aria-label="مسح"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="search-dropdown">
          {results.length > 0 ? (
            results.map((item) => (
              <Link
                key={`${item._type}-${item.id}`}
                href={item._href}
                className="search-result-item"
                onClick={() => { setOpen(false); setQuery(""); }}
              >
                <span className="search-result-badge">{item._label}</span>
                <span className="search-result-title">{item.title}</span>
                {item._sub && (
                  <span className="search-result-sub">{item._sub}</span>
                )}
              </Link>
            ))
          ) : suggestion ? (
            <div className="search-suggestion">
              <span>لا توجد نتائج مطابقة.</span>
              <button className="search-suggestion-btn" onClick={handleSuggestionClick}>
                هل تقصد: <strong>{suggestion}</strong>؟
              </button>
            </div>
          ) : (
            <div className="search-no-results">لا توجد نتائج لـ "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}
