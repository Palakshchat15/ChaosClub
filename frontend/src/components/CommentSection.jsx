import { useEffect, useRef, useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import { gsap } from "../lib/animations";
import { motion, AnimatePresence } from "framer-motion";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name, src }) {
  const initials = name ? name.charAt(0).toUpperCase() : "?";
  const colors = ["#1aff8a", "#52ff1a", "#00d4ff", "#ff6b6b", "#ffe440"];
  const color = colors[name ? name.charCodeAt(0) % colors.length : 0];

  if (src) {
    return (
      <div style={{
        width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
        overflow: "hidden", border: `2px solid ${color}55`,
      }}>
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  return (
    <div style={{
      width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
      background: `${color}22`, border: `2px solid ${color}55`,
      display: "grid", placeItems: "center",
      fontWeight: 700, fontSize: "15px", color,
    }}>
      {initials}
    </div>
  );
}

function CommentSection({ articleId }) {
  const auth = getAuth();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  
  // Edit & Modal States
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const pickerWrapRef = useRef(null);

  async function fetchComments() {
    try {
      const data = await api.get(`/api/articles/${articleId}/comments`);
      setComments(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchComments(); }, [articleId]);

  useEffect(() => {
    if (!loading && listRef.current) {
      const cards = listRef.current.querySelectorAll(".comment-card");
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: "power3.out" }
        );
      }
    }
  }, [loading, comments.length]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    function handler(e) {
      if (pickerWrapRef.current && !pickerWrapRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  // Insert emoji at cursor
  function insertEmoji(emojiObj) {
    const emoji = emojiObj.native;
    const el = textareaRef.current;
    if (!el) { setBody((b) => b + emoji); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + emoji + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
    setShowPicker(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || !auth) return;
    setSubmitting(true);
    setError("");
    try {
      const newComment = await api.post(`/api/articles/${articleId}/comments`, {
        user_id: auth.user_id,
        body: body.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setBody("");
      setTimeout(() => {
        const cards = listRef.current?.querySelectorAll(".comment-card");
        if (cards?.length) {
          gsap.fromTo(cards[cards.length - 1],
            { opacity: 0, y: 20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }
          );
        }
      }, 50);
    } catch (err) {
      setError(err.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(commentId) {
    if (!editBody.trim() || !auth) return;
    try {
      const updated = await api.put(`/api/articles/${articleId}/comments/${commentId}`, {
        user_id: auth.user_id,
        body: editBody.trim(),
      });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch (err) {
      alert(err.message || "Failed to update comment.");
    }
  }

  async function handleConfirmDelete() {
    if (!auth || !commentToDelete) return;
    setDeletingId(commentToDelete.id);
    try {
      await api.delete(`/api/articles/${articleId}/comments/${commentToDelete.id}?user_id=${auth.user_id}`);
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      setCommentToDelete(null);
    } catch (err) {
      alert(err.message || "Failed to delete comment.");
    } finally {
      setDeletingId(null);
    }
  }

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditBody(c.body);
  };

  const isOwner = (c) => auth && auth.user_id === c.user_id;
  const isAdmin = auth && auth.role === "admin";

  return (
    <section className="comment-section">
      {/* ── CUSTOM DELETE MODAL ─────────────────── */}
      <AnimatePresence>
        {commentToDelete && (
          <div className="modal-overlay" onClick={() => setCommentToDelete(null)}>
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon">🗑️</div>
              <h3>Delete Comment?</h3>
              <p>Are you sure you want to remove this comment? This action is permanent.</p>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-primary" 
                  style={{ background: "#ff4d4d", borderColor: "#ff4d4d", padding: "10px 24px" }}
                  onClick={handleConfirmDelete}
                  disabled={deletingId}
                >
                  {deletingId ? "Deleting..." : "Yes, Delete"}
                </button>
                <button className="btn" onClick={() => setCommentToDelete(null)} disabled={deletingId}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="comment-header">
        <div className="section-eyebrow" style={{ margin: 0 }}>Discussion</div>
        <span className="comment-count">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="comment-divider" />

      {/* List */}
      {loading ? (
        <div className="empty-state" style={{ padding: "24px 0" }}>Loading comments...</div>
      ) : (
        <div ref={listRef} className="comment-list">
          {comments.length === 0 ? (
            <div className="empty-state comment-empty">
              No comments yet. Be the first to start the discussion! ⚽
            </div>
          ) : comments.map((c) => (
            <div key={c.id} className="comment-card">
              <Avatar name={c.author} src={c.avatar_url} />
              <div className="comment-body-wrap">
                <div className="comment-meta">
                  <span className="comment-author">{c.author}</span>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                    {isOwner(c) && (
                      <button className="comment-action-btn" onClick={() => startEdit(c)} title="Edit">✏️</button>
                    )}
                    {(isOwner(c) || isAdmin) && (
                      <button className="comment-action-btn" onClick={() => setCommentToDelete(c)} title="Delete">🗑</button>
                    )}
                  </div>
                </div>
                
                {editingId === c.id ? (
                  <div className="comment-edit-box">
                    <textarea
                      className="comment-textarea"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={2}
                      autoFocus
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "11px" }} onClick={() => handleUpdate(c.id)}>Save</button>
                      <button className="btn" style={{ padding: "6px 12px", fontSize: "11px" }} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="comment-text">{c.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="comment-divider" />

      {/* Form */}
      {auth ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <Avatar name={auth.name} src={auth.avatar_url} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Textarea row */}
            <div style={{ position: "relative" }}>
              <textarea
                ref={textareaRef}
                className="comment-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                maxLength={2000}
                style={{ paddingRight: "44px" }}
              />
              {/* Emoji toggle */}
              <button
                type="button"
                className={`emoji-toggle-btn ${showPicker ? "emoji-toggle-active" : ""}`}
                onClick={() => setShowPicker((s) => !s)}
                title="Pick an emoji"
              >
                😊
              </button>

              {/* Full emoji-mart picker */}
              {showPicker && (
                <div ref={pickerWrapRef} className="emoji-mart-wrap">
                  <Picker
                    data={data}
                    onEmojiSelect={insertEmoji}
                    theme="dark"
                    previewPosition="none"
                    skinTonePosition="none"
                    searchPosition="sticky"
                    navPosition="top"
                    perLine={9}
                    emojiSize={22}
                    emojiButtonSize={32}
                    maxFrequentRows={2}
                  />
                </div>
              )}
            </div>

            {error && <p style={{ color: "#ff6b6b", fontSize: "13px", margin: 0 }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{body.length} / 2000</span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!body.trim() || submitting}
                style={{ padding: "10px 24px" }}
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <span>💬</span>
          <span>
            <a href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Log in</a>
            {" "}to join the discussion
          </span>
        </div>
      )}
    </section>
  );
}

export default CommentSection;
