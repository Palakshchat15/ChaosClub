import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "../lib/animations";
import ReadingProgress from "../components/ReadingProgress";
import CommentSection from "../components/CommentSection";
import { uploadImage } from "../lib/uploadImage";

function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const isAdmin = auth?.role === "admin";

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Edit Mode State ─────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ category: "", title: "", excerpt: "", content: "", title_image_url: "" });
  const [saving, setSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const editEditorRef = useRef(null);
  const editTitleImageInputRef = useRef(null);
  const editInlineImageInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const payload = await api.get(`/api/articles`);
        const found = payload.find((a) => a.id === Number(id));
        if (found) {
          setArticle(found);
        } else {
          setError("Article not found.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const titleRef = useRef(null);
  const metaRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (article && titleRef.current) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(titleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 })
        .fromTo(metaRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
        .fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2");
    }
  }, [article]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/articles/${id}?admin_user_id=${auth.user_id}`);
      navigate("/news");
    } catch (err) {
      alert(err.message || "Failed to delete article.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  function startEditing() {
    setEditForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || article.excerpt,
      title_image_url: article.image_url,
    });
    setIsEditing(true);
    // Pre-fill content after a tick
    setTimeout(() => {
      if (editEditorRef.current) {
        editEditorRef.current.innerHTML = article.content || `<p>${article.excerpt}</p>`;
      }
    }, 50);
  }

  async function handleUpdate(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setEditMessage("");
    const htmlContent = editEditorRef.current?.innerHTML || editForm.content;
    try {
      const contextImages = htmlContent.match(/<img[^>]+src="([^"]+)"/g)
        ?.map(tag => { const m = tag.match(/src="([^"]+)"/); return m ? m[1] : ""; })
        .filter(Boolean) || [];

      const updated = await api.put(`/api/admin/articles/${id}?admin_user_id=${auth.user_id}`, {
        category: "Football", // default value since we removed UI
        title: editForm.title,
        excerpt: editForm.excerpt,
        content: htmlContent,
        title_image_url: editForm.title_image_url,
        context_images: contextImages,
      });
      setArticle(updated);
      setIsEditing(false);
    } catch (err) {
      setEditMessage("Update failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditTitleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      setEditMessage("Uploading image...");
      const url = await uploadImage(file, "articles/title");
      setEditForm(c => ({ ...c, title_image_url: url }));
      setEditMessage("");
    } catch (err) {
      setEditMessage("Title image upload failed: " + err.message);
    }
  }

  async function handleEditInlineImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      setEditMessage("Uploading image...");
      const url = await uploadImage(file, "articles/inline");
      editEditorRef.current?.focus();
      document.execCommand("insertImage", false, url);
      setEditMessage("");
    } catch (err) {
      setEditMessage("Image upload failed: " + err.message);
    }
  }

  function runCommand(cmd, val = null) {
    if (!editEditorRef.current) return;
    editEditorRef.current.focus();
    document.execCommand(cmd, false, val);
  }

  if (loading) return <div className="section"><div className="empty-state">Loading article...</div></div>;
  if (error) return <div className="section"><div className="empty-state">{error}</div></div>;
  if (!article) return null;

  return (
    <>
      <ReadingProgress />
      
      {/* ── CUSTOM DELETE MODAL ─────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon" style={{ fontSize: "32px", fontWeight: "bold", color: "#ff4d4d", marginBottom: "16px" }}>!</div>
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete <strong>"{article.title}"</strong>? This action cannot be undone.</p>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-primary" 
                  style={{ background: "#ff4d4d", borderColor: "#ff4d4d", padding: "10px 24px" }}
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Yes, Delete Permanently"}
                </button>
                <button className="btn" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        className="section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: "800px", margin: "0 auto" }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
          <Link to="/news" className="btn">← Back to News</Link>
          {isAdmin && !isEditing && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn"
                onClick={startEditing}
                style={{ borderColor: "var(--accent)", color: "var(--accent)", display: "flex", alignItems: "center", gap: "8px" }}
              >
                 Edit Article
              </button>
              <button
                className="btn"
                onClick={() => setShowDeleteModal(true)}
                style={{ borderColor: "#ff4d4d", color: "#ff4d4d", display: "flex", alignItems: "center", gap: "8px" }}
              >
                 Delete Article
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="card" style={{ background: "rgba(82, 255, 26, 0.05)", border: "2px solid var(--accent)" }}>
            <h2 style={{ marginBottom: "20px" }}>Editing Article</h2>
            <form className="stack" onSubmit={handleUpdate}>
              <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "20px" }}>
                <input
                  className="form-input"
                  placeholder="Title"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>
              <textarea
                className="form-input"
                placeholder="Excerpt"
                rows={2}
                value={editForm.excerpt}
                onChange={e => setEditForm({ ...editForm, excerpt: e.target.value })}
                required
                style={{ background: "var(--card-bg)" }}
              />

              <div className="editor-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                <span className="muted">Title Image</span>
                <button className="btn" type="button" onClick={() => editTitleImageInputRef.current?.click()}>Change Image</button>
                <input ref={editTitleImageInputRef} type="file" accept="image/*" onChange={handleEditTitleImage} style={{ display: "none" }} />
              </div>
              {editForm.title_image_url && (
                <img src={editForm.title_image_url} alt="preview" style={{ maxHeight: "150px", objectFit: "cover", borderRadius: "8px" }} />
              )}

              <div className="rich-toolbar" style={{ marginTop: "20px" }}>
                <button className="btn" type="button" onClick={() => runCommand("bold")}>B</button>
                <button className="btn" type="button" onClick={() => runCommand("italic")}>I</button>
                <button className="btn" type="button" onClick={() => runCommand("underline")}>U</button>
                <button className="btn" type="button" onClick={() => runCommand("formatBlock", "h2")}>H2</button>
                <button className="btn" type="button" onClick={() => editInlineImageInputRef.current?.click()}>Add Image</button>
                <input ref={editInlineImageInputRef} type="file" accept="image/*" onChange={handleEditInlineImage} style={{ display: "none" }} />
              </div>

              <div
                ref={editEditorRef}
                className="rich-editor"
                contentEditable
                suppressContentEditableWarning
                style={{ minHeight: "400px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", padding: "20px", borderRadius: "8px" }}
              />

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button className="btn" type="button" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </button>
              </div>
              {editMessage && <p className={editMessage.includes("failed") ? "error-text" : "success-text"}>{editMessage}</p>}
            </form>
          </div>
        ) : (
          <>
            <h1
              ref={titleRef}
              style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: "1", margin: "12px 0 24px", opacity: 0 }}
            >
              {article.title}
            </h1>

            <div ref={metaRef} className="article-meta" style={{ marginBottom: "32px", display: "flex", gap: "16px", alignItems: "center", opacity: 0 }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: article.author_avatar_url ? "transparent" : "var(--border)",
                border: "2px solid var(--accent)",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                fontWeight: "bold",
                color: "var(--accent)"
              }}>
                {article.author_avatar_url ? (
                  <img src={article.author_avatar_url} alt={article.author} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  article.author.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ color: "var(--text)" }}>{article.author}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            {article.image_url && (
              <div style={{ 
                width: "100%", 
                aspectRatio: "16/9", 
                backgroundColor: "rgba(0,0,0,0.3)", 
                borderRadius: "12px", 
                overflow: "hidden", 
                marginBottom: "40px", 
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <motion.img
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  src={article.image_url}
                  alt={article.title}
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "100%", 
                    objectFit: "contain" 
                  }}
                />
              </div>
            )}

            <div
              ref={contentRef}
              className="rich-editor"
              style={{ border: "none", padding: "0", background: "transparent", fontSize: "18px", lineHeight: "1.8", opacity: 0 }}
              dangerouslySetInnerHTML={{ __html: article.content || `<p>${article.excerpt}</p>` }}
            />
          </>
        )}

        {/* Comments */}
        <CommentSection articleId={article.id} />
      </motion.div>
    </>
  );
}

export default ArticlePage;
