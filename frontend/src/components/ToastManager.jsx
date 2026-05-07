import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function ToastManager() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [shownIds, setShownIds] = useState(new Set());

  useEffect(() => {
    if (!auth) return;

    async function checkNewToasts() {
      try {
        const data = await api.get(`/api/notifications?user_id=${auth.user_id}`);
        // Filter for unread notifications we haven't shown yet in this session
        const unread = data.filter(n => !n.is_read && !shownIds.has(n.id));
        
        if (unread.length > 0) {
          unread.forEach(t => {
            addToast(t);
            setShownIds(prev => new Set(prev).add(t.id));
          });
        }
      } catch (err) {
        console.error("Toast poll failed", err);
      }
    }

    // Check immediately on mount/auth
    checkNewToasts();

    const interval = setInterval(checkNewToasts, 8000); // Check every 8s
    return () => clearInterval(interval);
  }, [auth, shownIds]);

  function addToast(notification) {
    const toastId = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { toastId, ...notification }]);
    
    // Auto-remove toast after 6s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== toastId));
    }, 6000);
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.toastId !== id));
  }

  function handleToastClick(toast) {
    if (toast.link) {
      navigate(toast.link);
    }
    removeToast(toast.toastId);
  }

  if (!auth) return null;

  return (
    <div style={{ 
      position: "fixed", 
      top: "20px", 
      right: "20px", 
      zIndex: 10000, 
      display: "flex", 
      flexDirection: "column", 
      gap: "10px",
      pointerEvents: "none"
    }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.toastId}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            onClick={() => handleToastClick(t)}
            style={{ 
              pointerEvents: "auto",
              cursor: "pointer",
              background: "rgba(20, 25, 37, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--primary)",
              borderRadius: "12px",
              padding: "16px",
              width: "320px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 15px rgba(82, 255, 26, 0.2)",
              display: "flex",
              gap: "15px",
              alignItems: "center"
            }}
          >
            <div style={{ 
              width: "40px", 
              height: "40px", 
              background: "rgba(82, 255, 26, 0.1)", 
              borderRadius: "10px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}>
              ⚽
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--primary)", marginBottom: "4px" }}>
                {t.title}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", lineHeight: "1.4" }}>
                {t.message}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); removeToast(t.toastId); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "5px" }}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
