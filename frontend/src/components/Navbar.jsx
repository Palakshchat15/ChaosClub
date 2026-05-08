import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { clearAuth, getAuth, setAuth } from "../lib/auth";
import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/animations";
import { uploadImage } from "../lib/uploadImage";
import { api } from "../lib/api";
import Magnetic from "./Magnetic";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const [auth, setAuthState] = useState(getAuth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const actionsRef = useRef(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileMenuOpen]);

  // ── Entrance timeline ──────────────────────────────────────
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(headerRef.current,
      { y: -90, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65 }
    )
      .fromTo(logoRef.current,
        { scale: 0.6, opacity: 0, rotation: -8 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.55 },
        "-=0.35"
      )
      .fromTo(".nav-link-item",
        { y: -18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.07 },
        "-=0.25"
      )
      .fromTo(actionsRef.current,
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4 },
        "-=0.3"
      );
  }, []);

  // ── Scroll: tighten navbar on scroll ──────────────────────
  useEffect(() => {
    function onScroll() {
      if (!headerRef.current) return;
      if (window.scrollY > 50) {
        gsap.to(headerRef.current, {
          borderBottomColor: "rgba(82, 255, 26, 0.25)",
          backdropFilter: "blur(20px)",
          duration: 0.4,
        });
      } else {
        gsap.to(headerRef.current, {
          borderBottomColor: "#141925",
          duration: 0.4,
        });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Close dropdown on outside click ───────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // ── Nav link magnetic hover ────────────────────────────────
  function onLinkEnter(e) {
    gsap.to(e.currentTarget, { y: -3, duration: 0.2, ease: "power2.out", clearProps: "color" });
  }
  function onLinkLeave(e) {
    gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: "elastic.out(1,0.5)", clearProps: "color" });
  }

  function handleLogout() {
    clearAuth();
    window.location.href = "/";
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file || !auth) return;
    e.target.value = "";
    setUploading(true);
    setDropdownOpen(false);
    try {
      const url = await uploadImage(file, "avatars");
      await api.post(`/api/users/${auth.user_id}/avatar`, { avatar_url: url });
      const updated = { ...auth, avatar_url: url };
      setAuth(updated);
      setAuthState(updated);
    } catch (err) {
      alert("Photo upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  // Avatar circle — photo or initials fallback
  const accentColor = "#52ff1a";
  const AvatarCircle = ({ size = 34 }) => (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      overflow: "hidden", flexShrink: 0,
      border: `2px solid ${uploading ? "#888" : accentColor}55`,
      background: auth?.avatar_url ? "transparent" : `${accentColor}15`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "border-color 0.2s, transform 0.2s",
      position: "relative",
    }}>
      {uploading ? (
        <div style={{ fontSize: "10px", color: "#888" }}>...</div>
      ) : auth?.avatar_url ? (
        <img src={auth.avatar_url} alt={auth.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontWeight: 700, fontSize: `${size * 0.38}px`, color: accentColor }}>
          {auth?.name?.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  return (
    <>
      <header ref={headerRef} className="site-header" style={{ transition: "border-bottom-color 0.3s ease" }}>
        {/* Neon green accent line at the very top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent 0%, #52ff1a 40%, #00ffcc 60%, transparent 100%)",
          opacity: 0.7,
        }} />

        <div className="site-header-inner">

          {/* ── BRAND ── */}
          <Link ref={logoRef} to="/" className="brand navbar-brand" style={{ display: "flex", alignItems: "center", gap: "10px", opacity: 0 }}>
            <img
              src="/logo_transparent.png"
              alt="Chaos Club"
              style={{ height: "38px", width: "auto", objectFit: "contain" }}
            />
            <span className="brand-text">
              CHAOS<span className="brand-accent">CLUB</span>
            </span>
          </Link>

          {/* ── NAV LINKS (Desktop) ── */}
          <nav className="nav-links">
            {[
              { to: "/news", label: "News" },
              { to: "/predict", label: "Predict" },
              { to: "/funzone", label: "Fun Zone" },
              { to: "/leaderboard", label: "Leaderboard" },
              { to: "/about", label: "About" },
              ...(auth?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-link-item${isActive ? " nav-link-active" : ""}`
                }
                onMouseEnter={onLinkEnter}
                onMouseLeave={onLinkLeave}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── MOBILE MENU TOGGLE ── */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px",
              zIndex: 10001
            }}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          {/* ── AUTH ACTIONS ── */}
          <div ref={actionsRef} className="nav-actions" style={{ opacity: 0 }}>
            {auth ? (
              <>
                <NotificationBell />

                {/* Avatar + name + dropdown */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
                      borderRadius: "8px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(82,255,26,0.07)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <AvatarCircle size={34} />
                    <span style={{ fontSize: "12px", letterSpacing: "0.05em", color: "var(--muted)", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {auth.name}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "-4px" }}>
                      {dropdownOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="nav-dropdown" style={{
                      position: "absolute", top: "calc(100% + 10px)", right: 0,
                      background: "linear-gradient(145deg, #1c2540 0%, #141a2e 100%)",
                      border: "1px solid rgba(82,255,26,0.18)",
                      borderRadius: "14px", padding: "8px", minWidth: "190px",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(82,255,26,0.05)",
                      zIndex: 9999,
                    }}>
                      {/* Profile header in dropdown */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <AvatarCircle size={42} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13px" }}>{auth.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{auth.role === "admin" ? "Admin" : "Fan"}</div>
                        </div>
                      </div>

                      <Link 
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          width: "100%", padding: "10px 12px",
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--fg)", fontSize: "13px", borderRadius: "8px",
                          marginBottom: "4px", transition: "background 0.2s",
                          textDecoration: "none"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(82,255,26,0.08)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                      >
                         <span style={{ display: "flex", alignItems: "center" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span> My Profile
                      </Link>

                      {/* Change Photo */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          width: "100%", padding: "10px 12px",
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--fg)", fontSize: "13px", borderRadius: "8px",
                          marginTop: "4px", transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(82,255,26,0.08)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </span> Change Photo
                      </button>

                      {/* Log Out */}
                      <button
                        onClick={handleLogout}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          width: "100%", padding: "10px 12px",
                          background: "none", border: "none", cursor: "pointer",
                          color: "#ff6b6b", fontSize: "13px", borderRadius: "8px",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,107,107,0.08)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </span> Log Out
                      </button>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />
                </div>
              </>
            ) : (
              <>
                <Link className="btn" to="/login">Log In</Link>
                <Link className="btn btn-primary" to="/signup">Join Club</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="mobile-drawer-fixed"
            >
              {[
                { to: "/news", label: "News" },
                { to: "/predict", label: "Predict" },
                { to: "/funzone", label: "Fun Zone" },
                { to: "/leaderboard", label: "Leaderboard" },
                { to: "/about", label: "About" },
                ...(auth?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
                >
                  {label}
                </NavLink>
              ))}
              
              {/* Auth actions for mobile */}
              <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(82,255,26,0.1)", display: "flex", flexDirection: "column", gap: "12px" }}>
                {auth ? (
                  <>
                    <NavLink
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
                    >
                      My Profile
                    </NavLink>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      style={{
                        background: "none", border: "none", color: "#ff6b6b", 
                        fontSize: "clamp(24px, 6vw, 36px)", fontWeight: "600", 
                        textTransform: "uppercase", textAlign: "left", padding: 0, 
                        fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.05em",
                        cursor: "pointer"
                      }}
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
                    >
                      Log In
                    </NavLink>
                    <NavLink
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
                      style={{ color: "var(--primary)" }}
                    >
                      Join Club
                    </NavLink>
                  </>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 9999 }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
