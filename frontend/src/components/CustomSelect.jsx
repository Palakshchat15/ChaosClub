import { useEffect, useRef, useState } from "react";

/**
 * CustomSelect — drop-in replacement for <select className="form-input">.
 * Props:
 *   value, onChange, options: [{ value, label }], placeholder, id, disabled, style
 */
function CustomSelect({ value, onChange, options = [], placeholder = "Select…", id, disabled, style }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleSelect(optValue) {
    onChange({ target: { value: optValue } });
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      id={id}
      style={{ position: "relative", width: "100%", ...style }}
    >
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          background: open
            ? "rgba(82, 255, 26, 0.06)"
            : "rgba(255, 255, 255, 0.04)",
          border: open
            ? "1px solid rgba(82, 255, 26, 0.45)"
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          padding: "11px 16px",
          color: selected ? "var(--text)" : "rgba(255,255,255,0.35)",
          fontSize: "14px",
          fontFamily: "inherit",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
          boxShadow: open
            ? "0 0 0 3px rgba(82,255,26,0.1)"
            : "none",
          textAlign: "left",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Animated chevron */}
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="rgba(82,255,26,0.7)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          className="custom-select-list"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "linear-gradient(160deg, #1e2840 0%, #141a2e 100%)",
            border: "1px solid rgba(82,255,26,0.18)",
            borderRadius: "12px",
            padding: "6px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(82,255,26,0.06)",
            zIndex: 9998,
            maxHeight: "240px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(82,255,26,0.3) transparent",
          }}
        >
          {options.map((opt, i) => {
            const isActive = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive
                    ? "rgba(82,255,26,0.12)"
                    : "transparent",
                  color: isActive ? "#52ff1a" : "var(--text)",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease, padding-left 0.15s ease",
                  fontWeight: isActive ? 600 : 400,
                  animationDelay: `${i * 0.03}s`,
                  animation: "optionIn 0.18s ease both",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.paddingLeft = "18px";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.paddingLeft = "14px";
                  }
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#52ff1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {!isActive && <span style={{ width: "12px", display: "inline-block" }} />}
                  {opt.label}
                </span>
              </button>
            );
          })}
          {options.length === 0 && (
            <div style={{ padding: "12px 14px", color: "var(--muted)", fontSize: "13px" }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
