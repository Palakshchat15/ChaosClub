import { useEffect, useState, useRef } from "react";
import { getAuth } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function MatchChat({ matchId }) {
  const auth = getAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!auth || !matchId) return;

    // Use environment variable or fallback to local port
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsBase = window.location.port === "5173" || window.location.port === "3000"
      ? "localhost:8000"
      : window.location.host;

    const url = `${wsProtocol}//${wsBase}/ws/chat/${matchId}?user_id=${auth.user_id}`;

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "history") {
        setMessages(data.data);
      } else if (data.type === "message") {
        setMessages(prev => [...prev, data]);
      }
    };

    return () => {
      socket.close();
    };
  }, [matchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.send(input);
    setInput("");
  }

  if (!auth) return (
    <div className="card" style={{ padding: "20px", textAlign: "center", background: "rgba(0,0,0,0.3)" }}>
      <p className="muted" style={{ fontSize: "14px" }}>Log in to join the chat.</p>
    </div>
  );

  return (
    <div className="card chat-container" style={{
      display: "flex",
      flexDirection: "column",
      height: "400px",
      padding: "0",
      background: "rgba(20, 25, 37, 0.8)",
      border: "1px solid rgba(255,255,255,0.05)",
      overflow: "hidden"
    }}>
      <div className="chat-header" style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: connected ? "var(--primary)" : "#ff4d4d" }} />
          <span style={{ fontWeight: "700", fontSize: "13px", letterSpacing: "1px" }}>LIVE CHAT</span>
        </div>
        <span className="muted" style={{ fontSize: "11px" }}>{messages.length} messages</span>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((m, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i}
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <img
              src={m.user_avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + m.user_name}
              alt=""
              style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "2px" }}>
                <span style={{ fontWeight: "700", fontSize: "12px", color: m.user_name === auth.name ? "var(--primary)" : "#fff" }}>
                  {m.user_name}
                </span>
                <span className="muted" style={{ fontSize: "10px" }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", lineHeight: "1.4" }}>
                {m.message}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px" }}>
        <input
          className="form-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          style={{ height: "36px", fontSize: "13px", background: "rgba(0,0,0,0.3)" }}
        />
        <button className="btn btn-primary" style={{ height: "36px", padding: "0 15px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
