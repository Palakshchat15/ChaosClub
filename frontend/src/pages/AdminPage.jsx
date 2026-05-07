import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import { uploadImage } from "../lib/uploadImage";
import CustomSelect from "../components/CustomSelect";
import Magnetic from "../components/Magnetic";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function AdminPage() {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin";

  const [articleForm, setArticleForm] = useState({
    category: "Football",
    title: "",
    excerpt: "",
    content: "",
    title_image_url: "",
    scheduled_at: ""
  });
  const [matchForm, setMatchForm] = useState({
    home_team: "",
    away_team: "",
    kickoff_at: "",
    competition: "",
    venue: ""
  });
  const [resultForm, setResultForm] = useState({
    match_id: "",
    home_goals: 0,
    away_goals: 0,
    goalscorers: ""
  });
  const [funZoneForm, setFunZoneForm] = useState({
    riddle: [{ hints: ["", "", ""], answer: "", image_url: "" }],
    rumor: [{ text: "", votes: { hot: 0, not: 0 } }],
    charades: [{ emojis: "", answer: "" }],
    on_this_day: { fact: "" },
    prediction: [{ question: "", votes: { yes: 0, no: 0 } }],
    scheduled_at: ""
  });

  const [matches, setMatches] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [articles, setArticles] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [articleMessage, setArticleMessage] = useState("");
  const [articleError, setArticleError] = useState("");
  const [busy, setBusy] = useState(false);
  const [discoveredMatches, setDiscoveredMatches] = useState([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverLeague, setDiscoverLeague] = useState(39); // Premier League
  const [deleteModal, setDeleteModal] = useState({ open: false, articleId: null });
  const editorRef = useRef(null);
  const inlineImageInputRef = useRef(null);
  const titleImageInputRef = useRef(null);
  const funZoneImageInputRef = useRef(null);

  const pendingMatchOptions = useMemo(
    () => matches.filter((match) => match.status !== "finished"),
    [matches]
  );

  useEffect(() => {
    if (!isAdmin) return;
    async function loadAdminData() {
      try {
        const [matchData, rewardData, articleData, funZoneData] = await Promise.all([
          api.get("/api/matches"),
          api.get("/api/rewards"),
          api.get("/api/articles"),
          api.get("/api/funzone/current").catch(() => null)
        ]);
        setMatches(matchData);
        setRewards(rewardData);
        setArticles(articleData);
        if (funZoneData) {
          const parseFZArray = (str, def) => {
            try {
              const parsed = JSON.parse(str);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              if (parsed && !Array.isArray(parsed) && Object.keys(parsed).length > 0) return [parsed];
              return def;
            } catch { return def; }
          };
          const parseFZObj = (str, def) => {
            try { return str && str !== "{}" ? { ...def, ...JSON.parse(str) } : def; } catch { return def; }
          };
          setFunZoneForm({
            riddle: parseFZArray(funZoneData.riddle, [{ hints: ["", "", ""], answer: "", image_url: "" }]),
            rumor: parseFZArray(funZoneData.rumor, [{ text: "", votes: { hot: 0, not: 0 } }]),
            charades: parseFZArray(funZoneData.charades, [{ emojis: "", answer: "" }]),
            on_this_day: parseFZObj(funZoneData.on_this_day, { fact: "" }),
            prediction: parseFZArray(funZoneData.prediction, [{ question: "", votes: { yes: 0, no: 0 } }]),
            scheduled_at: funZoneData.scheduled_at ? new Date(funZoneData.scheduled_at).toISOString().slice(0, 16) : ""
          });
        }
        if (matchData.length > 0) {
          const pending = matchData.find((item) => item.status !== "finished");
          if (pending) {
            setResultForm((current) => ({ ...current, match_id: String(pending.id) }));
          }
        }
      } catch (err) {
        setStatusMessage(err.message);
      }
    }
    loadAdminData();
  }, [isAdmin]);

  if (!auth) {
    return (
      <section className="section">
        <div className="empty-state">
          Please log in first. <Link to="/login">Go to login</Link>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="section">
        <div className="empty-state">Admin access only.</div>
      </section>
    );
  }

  function runEditorCommand(command, value) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setArticleForm((current) => ({ ...current, content: editorRef.current.innerHTML }));
  }

  function handleEditorInput() {
    if (!editorRef.current) return;
    setArticleForm((current) => ({ ...current, content: editorRef.current.innerHTML }));
  }

  async function handleInlineImageInsert(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      setStatusMessage("Uploading image...");
      const url = await uploadImage(file, "articles/inline");
      runEditorCommand("insertImage", url);
      setStatusMessage("");
    } catch (err) {
      setStatusMessage("Image upload failed: " + err.message);
    }
  }

  async function handleTitleImagePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      setStatusMessage("Uploading title image...");
      const url = await uploadImage(file, "articles/title");
      setArticleForm((current) => ({ ...current, title_image_url: url }));
      setStatusMessage("");
    } catch (err) {
      setStatusMessage("Title image upload failed: " + err.message);
    }
  }

  async function handleFunZoneImagePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      setStatusMessage("Uploading riddle image...");
      const url = await uploadImage(file, "funzone");
      setFunZoneForm(c => ({
        ...c,
        riddle: [{ ...c.riddle[0], image_url: url }]
      }));
      setStatusMessage("Riddle image uploaded!");
    } catch (err) {
      setStatusMessage("Upload failed: " + err.message);
    }
  }

  async function handleCreateArticle(event) {
    event.preventDefault();
    setArticleMessage("");
    setArticleError("");

    const htmlContent = editorRef.current?.innerHTML || articleForm.content || "";
    const plainText = htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!articleForm.title.trim()) {
      setArticleError("Please add an article title.");
      return;
    }
    if (!articleForm.excerpt.trim()) {
      setArticleError("Please add a short excerpt.");
      return;
    }
    if (plainText.length < 20) {
      setArticleError("Article body is too short. Please write at least 20 characters.");
      return;
    }

    setBusy(true);
    setStatusMessage("");
    try {
      const payload = await api.post(`/api/admin/articles?admin_user_id=${auth.user_id}`, {
        category: "Football", // default value since we removed UI
        title: articleForm.title,
        excerpt: articleForm.excerpt,
        content: htmlContent,
        title_image_url: articleForm.title_image_url || null,
        scheduled_at: articleForm.scheduled_at ? new Date(articleForm.scheduled_at).toISOString() : null,
        context_images:
          htmlContent.match(/<img[^>]+src="([^">]+)"/g)?.map((tag) => {
            const match = tag.match(/src="([^">]+)"/);
            return match ? match[1] : "";
          }).filter(Boolean) || []
      });
      setArticles((current) => [payload, ...current]);
      setArticleForm({
        category: "Football",
        title: "",
        excerpt: "",
        content: "",
        title_image_url: "",
        scheduled_at: ""
      });
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setStatusMessage("Article published successfully.");
      setArticleMessage("Article published successfully.");
    } catch (err) {
      const message = err?.message || "Article publish failed. Please try again.";
      setStatusMessage(message);
      setArticleError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateMatch(event) {
    event.preventDefault();
    setBusy(true);
    setStatusMessage("");
    try {
      const payload = await api.post(`/api/admin/matches?admin_user_id=${auth.user_id}`, {
        ...matchForm,
        kickoff_at: new Date(matchForm.kickoff_at).toISOString()
      });
      setMatches((current) => [...current, payload]);
      setMatchForm({ home_team: "", away_team: "", kickoff_at: "", competition: "", venue: "" });
      setStatusMessage("Match created.");
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscoverMatches() {
    setDiscovering(true);
    setStatusMessage("");
    try {
      const results = await api.get(`/api/admin/matches/discover?admin_user_id=${auth.user_id}&league_id=${discoverLeague}`);
      setDiscoveredMatches(results);
      if (results.length === 0) setStatusMessage("No matches found for this league.");
    } catch (err) {
      setStatusMessage("Discovery failed: " + err.message);
    } finally {
      setDiscovering(false);
    }
  }

  async function handleImportMatch(m) {
    setBusy(true);
    try {
      await api.post(`/api/admin/matches/import?admin_user_id=${auth.user_id}`, m);
      setStatusMessage(`Imported ${m.home_team} vs ${m.away_team}`);
      // Refresh local list
      const updated = await api.get("/api/matches");
      setMatches(updated);
      setDiscoveredMatches(prev => prev.filter(item => item.external_id !== m.external_id));
    } catch (err) {
      setStatusMessage("Import failed: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncResults() {
    setBusy(true);
    setStatusMessage("");
    try {
      const res = await api.post(`/api/admin/matches/sync-results?admin_user_id=${auth.user_id}`);
      setStatusMessage(res.message);
      // Refresh matches
      const updated = await api.get("/api/matches");
      setMatches(updated);
    } catch (err) {
      setStatusMessage("Sync failed: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFetchExternalResult() {
    if (!resultForm.match_id) return;
    setBusy(true);
    setStatusMessage("");
    try {
      const data = await api.get(`/api/admin/matches/${resultForm.match_id}/fetch-external-result?admin_user_id=${auth.user_id}`);
      setResultForm(prev => ({
        ...prev,
        home_goals: data.home_goals,
        away_goals: data.away_goals,
        goalscorers: data.scorers.join(", ")
      }));
      setStatusMessage("Data fetched! You can now review and publish.");
    } catch (err) {
      setStatusMessage("Could not fetch API data: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteArticle(id) {
    setDeleteModal({ open: true, articleId: id });
  }

  async function confirmDeleteArticle() {
    const id = deleteModal.articleId;
    if (!id) return;
    setBusy(true);
    try {
      await api.delete(`/api/admin/articles/${id}?admin_user_id=${auth.user_id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setArticleMessage("Article deleted successfully.");
      setDeleteModal({ open: false, articleId: null });
    } catch (err) {
      setArticleError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishResult(event) {
    event.preventDefault();
    if (!resultForm.match_id) return;
    setBusy(true);
    setStatusMessage("");
    try {
      const payload = await api.post(
        `/api/admin/matches/${resultForm.match_id}/result?admin_user_id=${auth.user_id}`,
        {
          home_goals: Number(resultForm.home_goals),
          away_goals: Number(resultForm.away_goals),
          goalscorers: resultForm.goalscorers
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        }
      );
      const refreshedMatches = await api.get("/api/matches");
      const refreshedRewards = await api.get("/api/rewards");
      setMatches(refreshedMatches);
      setRewards(refreshedRewards);
      setStatusMessage(`Result published. ${payload.length} prediction records settled.`);
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAutoGenerate() {
    setBusy(true);
    setStatusMessage("");
    try {
      await api.post(`/api/admin/funzone/generate?admin_user_id=${auth.user_id}`);
      setStatusMessage("AI generated new Fun Zone games! Reloading...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setStatusMessage("AI Generation failed: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateFunZone(event) {
    event.preventDefault();
    setBusy(true);
    setStatusMessage("");
    try {
      const payload = {
        riddle: JSON.stringify(funZoneForm.riddle),
        rumor: JSON.stringify(funZoneForm.rumor),
        charades: JSON.stringify(funZoneForm.charades),
        on_this_day: JSON.stringify(funZoneForm.on_this_day),
        prediction: JSON.stringify(funZoneForm.prediction),
        var_room: "{}",
        tic_tac_toe: "{}",
        scheduled_at: funZoneForm.scheduled_at ? new Date(funZoneForm.scheduled_at).toISOString() : null
      };
      await api.put(`/api/admin/funzone?admin_user_id=${auth.user_id}`, payload);
      setStatusMessage("Fun Zone updated successfully.");
    } catch (err) {
      setStatusMessage("Error updating Fun Zone: " + err.message);
    } finally {
      setBusy(false);
    }
  }


  return (
    <section className="section">
      <div className="section-eyebrow">Admin Control Room</div>
      <h1 className="section-title">ADMIN DASHBOARD</h1>
      {statusMessage ? <div className="empty-state">{statusMessage}</div> : null}

      <div className="grid admin-grid">
        <article className="card admin-editor-card">
          <h3>Publish Article</h3>
          <p className="muted">
            Write your article, then add images from your device at any point using the toolbar.
          </p>
          <form className="stack admin-editor-form" onSubmit={handleCreateArticle}>
            <input
              className="form-input"
              placeholder="Article title"
              value={articleForm.title}
              onChange={(event) => setArticleForm((c) => ({ ...c, title: event.target.value }))}
              required
            />
            <input
              className="form-input"
              placeholder="Short excerpt"
              value={articleForm.excerpt}
              onChange={(event) => setArticleForm((c) => ({ ...c, excerpt: event.target.value }))}
              required
            />

            <div className="editor-title-row">
              <span className="muted">Title image</span>
              <button className="btn" type="button" onClick={() => titleImageInputRef.current?.click()}>
                Upload Title Image
              </button>
              <input
                ref={titleImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleTitleImagePick}
                style={{ display: "none" }}
              />
            </div>
            {articleForm.title_image_url ? (
              <img className="editor-title-preview" src={articleForm.title_image_url} alt="Title preview" />
            ) : null}

            <div className="rich-toolbar">
              <button className="btn" type="button" onClick={() => runEditorCommand("bold")}>
                B
              </button>
              <button className="btn" type="button" onClick={() => runEditorCommand("italic")}>
                I
              </button>
              <button className="btn" type="button" onClick={() => runEditorCommand("underline")}>
                U
              </button>
              <button className="btn" type="button" onClick={() => runEditorCommand("formatBlock", "h2")}>
                H2
              </button>
              <button className="btn" type="button" onClick={() => runEditorCommand("insertUnorderedList")}>
                List
              </button>
              <button className="btn" type="button" onClick={() => runEditorCommand("formatBlock", "blockquote")}>
                Quote
              </button>
              <button className="btn" type="button" onClick={() => inlineImageInputRef.current?.click()}>
                Add Image
              </button>
              <input
                ref={inlineImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleInlineImageInsert}
                style={{ display: "none" }}
              />
            </div>

            <div
              ref={editorRef}
              className="rich-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              data-placeholder="Write your article here. Place cursor anywhere and use 'Add Image' to insert from device."
            />

            <div className="card" style={{ background: "rgba(82, 255, 26, 0.03)", border: "1px solid rgba(82, 255, 26, 0.1)", padding: "16px", borderRadius: "12px" }}>
              <div className="stack" style={{ gap: "8px" }}>
                <span className="muted" style={{ fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)" }}>
                  SCHEDULE PUBLICATION
                </span>
                <DatePicker
                  selected={articleForm.scheduled_at ? new Date(articleForm.scheduled_at) : null}
                  onChange={(date) => setArticleForm(c => ({ ...c, scheduled_at: date ? date.toISOString() : "" }))}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="form-input"
                  placeholderText="Pick a date and time..."
                  autoComplete="off"
                  portalId="root-portal"
                  popperPlacement="bottom-start"
                />
                <p style={{ fontSize: "11px", margin: 0, color: "var(--muted)", opacity: 0.8 }}>
                  Leave blank to publish instantly. Future times will keep the article hidden until then.
                </p>
              </div>
            </div>

            <button className="btn btn-primary" disabled={busy} style={{ marginTop: "8px" }}>
              {busy ? "Processing..." : (articleForm.scheduled_at ? "Schedule Article" : "Publish Article")}
            </button>
            {articleMessage ? <p className="success-text">{articleMessage}</p> : null}
            {articleError ? <p className="error-text">{articleError}</p> : null}
          </form>
        </article>

        <article className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>Live Match Discovery</h3>
            <span style={{ fontSize: "10px", background: "rgba(82, 255, 26, 0.1)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>FOOTBALL-DATA.ORG</span>
          </div>
          
          <div className="stack" style={{ gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <select 
                className="form-input" 
                value={discoverLeague} 
                onChange={(e) => setDiscoverLeague(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="39">Premier League</option>
                <option value="140">La Liga</option>
                <option value="78">Bundesliga</option>
                <option value="135">Serie A</option>
                <option value="2">UEFA Champions League</option>
                <option value="3">UEFA Europa League</option>
              </select>
              <button className="btn btn-primary" onClick={handleDiscoverMatches} disabled={discovering}>
                {discovering ? "Finding..." : "Discover"}
              </button>
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px", background: "rgba(0,0,0,0.1)" }}>
              {discoveredMatches.length === 0 ? (
                <p className="muted" style={{ textAlign: "center", fontSize: "12px", padding: "20px" }}>
                  Select a league and click Discover to see upcoming real-world matches.
                </p>
              ) : (
                <div className="stack" style={{ gap: "8px" }}>
                  {discoveredMatches.map((m) => (
                    <div key={m.external_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700" }}>{m.home_team} vs {m.away_team}</div>
                        <div style={{ fontSize: "11px" }} className="muted">{new Date(m.kickoff_at).toLocaleString()}</div>
                      </div>
                      <button className="btn" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => handleImportMatch(m)} disabled={busy}>
                        Import
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="card">
          <h3>Create Match For Predictions</h3>
          <form className="stack" onSubmit={handleCreateMatch}>
            <input
              className="form-input"
              placeholder="Home team"
              value={matchForm.home_team}
              onChange={(event) => setMatchForm((c) => ({ ...c, home_team: event.target.value }))}
              required
            />
            <input
              className="form-input"
              placeholder="Away team"
              value={matchForm.away_team}
              onChange={(event) => setMatchForm((c) => ({ ...c, away_team: event.target.value }))}
              required
            />
            <div className="stack" style={{ gap: "8px" }}>
              <span className="muted" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                Match Kickoff Time (UTC)
              </span>
              <DatePicker
                selected={matchForm.kickoff_at ? new Date(matchForm.kickoff_at) : null}
                onChange={(date) => setMatchForm((c) => ({ ...c, kickoff_at: date ? date.toISOString() : "" }))}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-input"
                placeholderText="Pick kickoff time..."
                autoComplete="off"
                required
                portalId="root-portal"
                popperPlacement="bottom-start"
              />
            </div>
            <input
              className="form-input"
              placeholder="Competition"
              value={matchForm.competition}
              onChange={(event) => setMatchForm((c) => ({ ...c, competition: event.target.value }))}
              required
            />
            <input
              className="form-input"
              placeholder="Venue"
              value={matchForm.venue}
              onChange={(event) => setMatchForm((c) => ({ ...c, venue: event.target.value }))}
              required
            />
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Create Match"}
            </button>
          </form>
        </article>

        <article className="card">
          <h3>Publish Match Result + Settle Points</h3>
          <form className="stack" onSubmit={handlePublishResult}>
            <CustomSelect
              value={resultForm.match_id}
              placeholder="Select match…"
              options={[
                ...pendingMatchOptions.map((m) => ({
                  value: m.id,
                  label: `${m.home_team} vs ${m.away_team} ${m.external_id ? "(API 🌍)" : "(Manual ✍️)"}`,
                }))
              ]}
              onChange={(event) => setResultForm((c) => ({ ...c, match_id: event.target.value }))}
            />
            {resultForm.match_id && matches.find(m => m.id == resultForm.match_id)?.external_id && (
              <button 
                type="button" 
                className="btn" 
                onClick={handleFetchExternalResult} 
                disabled={busy}
                style={{ fontSize: "11px", padding: "6px", borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                {busy ? "Fetching..." : "✨ Auto-fill from API"}
              </button>
            )}
            <div className="score-grid">
              <input
                className="form-input"
                type="number"
                min={0}
                value={resultForm.home_goals}
                onChange={(event) => setResultForm((c) => ({ ...c, home_goals: event.target.value }))}
              />
              <input
                className="form-input"
                type="number"
                min={0}
                value={resultForm.away_goals}
                onChange={(event) => setResultForm((c) => ({ ...c, away_goals: event.target.value }))}
              />
            </div>
            <input
              className="form-input"
              placeholder="Goalscorers (comma separated)"
              value={resultForm.goalscorers}
              onChange={(event) => setResultForm((c) => ({ ...c, goalscorers: event.target.value }))}
            />
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Publishing..." : "Publish Result"}
            </button>
          </form>
          
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="muted" style={{ fontSize: "11px", marginBottom: "10px" }}>
              Alternatively, trigger an automatic sync for all finished matches imported from the API.
            </p>
            <button className="btn" onClick={handleSyncResults} disabled={busy} style={{ width: "100%", borderColor: "var(--primary)", color: "var(--primary)" }}>
              {busy ? "Syncing..." : "Sync All Scores from API"}
            </button>
          </div>
        </article>
      </div>

      <div className="section grid admin-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
        <article className="card">
          <h3 style={{ marginBottom: "20px" }}>Recent Articles</h3>
          <div className="stack" style={{ gap: "12px" }}>
            {articles.length === 0 ? (
              <div className="muted">No articles found.</div>
            ) : (
              articles.slice(0, 10).map((article) => (
                <div key={article.id} className="card" style={{ 
                  display: "flex", 
                  gap: "16px", 
                  background: "rgba(255,255,255,0.03)", 
                  padding: "12px",
                  alignItems: "center"
                }}>
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "8px", 
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "linear-gradient(45deg, var(--primary), var(--secondary))"
                  }}>
                    {article.title_image_url ? (
                      <img src={article.title_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "crop" }} />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                      <span className="badge" style={{ fontSize: "10px", padding: "2px 6px" }}>{article.category}</span>
                      <span className="muted" style={{ fontSize: "10px" }}>
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "14px", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {article.title}
                    </h4>
                    <p className="muted" style={{ fontSize: "12px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {article.excerpt}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link to={`/news/${article.id}`} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}>Edit</Link>
                    <button 
                      className="btn" 
                      style={{ padding: "6px 12px", fontSize: "12px", borderColor: "rgba(255,255,255,0.1)" }}
                      onClick={() => handleDeleteArticle(article.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card">
          <h3 style={{ marginBottom: "20px" }}>Reward Eligibility Log</h3>
          <div className="stack" style={{ gap: "10px" }}>
            {rewards.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px" }}>No settled predictions yet.</div>
            ) : (
              rewards.map((row, index) => (
                <div key={`${row.id}-${index}`} className="card" style={{ 
                  padding: "12px", 
                  background: "rgba(255,255,255,0.02)",
                  borderLeft: row.eligible_for_gift ? "3px solid var(--primary)" : "1px solid var(--border)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600", fontSize: "13px" }}>{row.fan_name}</span>
                    <span className="muted" style={{ fontSize: "10px" }}>
                      Match #{row.match_id}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "11px" }}>
                      <span style={{ color: "var(--primary)" }}>+{row.result_points}</span> res, 
                      <span style={{ color: "var(--secondary)" }}> +{row.scoreline_points}</span> score, 
                      <span style={{ color: "#ffcc00" }}> +{row.goalscorer_points}</span> goal
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: "15px" }}>{row.total_points}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", alignItems: "center" }}>
                    {row.eligible_for_gift ? (
                      <span style={{ fontSize: "10px", color: "var(--primary)", background: "rgba(0,242,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                        GIFT ELIGIBLE
                      </span>
                    ) : (
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>NOT ELIGIBLE</span>
                    )}
                    <span className="muted" style={{ fontSize: "10px" }}>
                      {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      <div className="section-eyebrow" style={{ marginTop: "40px" }}>Leaderboard Management</div>
      <h2 className="section-title">MONTHLY POINTS</h2>
      <div className="card" style={{ marginBottom: "40px", border: "1px solid #ff4d4d", background: "rgba(255, 77, 77, 0.05)" }}>
        <p className="muted">Reset the monthly points for all users back to 0. This does not affect all-time points.</p>
        <button 
          className="btn" 
          style={{ borderColor: "#ff4d4d", color: "#ff4d4d", marginTop: "12px" }}
          onClick={async () => {
            if (window.confirm("Are you sure you want to reset the monthly leaderboard? This cannot be undone.")) {
              try {
                await api.post(`/api/admin/reset_monthly_points?admin_user_id=${auth.user_id}`);
                alert("Monthly points have been reset to 0.");
              } catch (err) {
                alert("Failed to reset monthly points: " + err.message);
              }
            }
          }}
        >
          Reset Monthly Leaderboard
        </button>
      </div>

      <div className="section-eyebrow">Daily Engagement</div>
      <h2 className="section-title">FUN ZONE MANAGEMENT</h2>
      <div className="card" style={{ marginBottom: "40px" }}>
        <p className="muted">Configure the daily games via standard inputs. Changes are automatically formatted.</p>
        <form className="stack" onSubmit={handleUpdateFunZone}>

          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "20px" }}>

            {/* Riddle */}
            <div className="card" style={{ background: "rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>"Who Am I?" (Player Riddle)</h3>
              <div className="stack">
                <input className="form-input" placeholder="Hint 1" value={funZoneForm.riddle?.[0]?.hints?.[0] || ""} onChange={e => setFunZoneForm({ ...funZoneForm, riddle: [{ ...funZoneForm.riddle[0], hints: [e.target.value, funZoneForm.riddle[0].hints[1], funZoneForm.riddle[0].hints[2]] }] })} />
                <input className="form-input" placeholder="Hint 2" value={funZoneForm.riddle?.[0]?.hints?.[1] || ""} onChange={e => setFunZoneForm({ ...funZoneForm, riddle: [{ ...funZoneForm.riddle[0], hints: [funZoneForm.riddle[0].hints[0], e.target.value, funZoneForm.riddle[0].hints[2]] }] })} />
                <input className="form-input" placeholder="Hint 3" value={funZoneForm.riddle?.[0]?.hints?.[2] || ""} onChange={e => setFunZoneForm({ ...funZoneForm, riddle: [{ ...funZoneForm.riddle[0], hints: [funZoneForm.riddle[0].hints[0], funZoneForm.riddle[0].hints[1], e.target.value] }] })} />
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input className="form-input" style={{ flex: 1 }} placeholder="Answer Name" value={funZoneForm.riddle?.[0]?.answer || ""} onChange={e => setFunZoneForm({ ...funZoneForm, riddle: [{ ...funZoneForm.riddle[0], answer: e.target.value }] })} />
                  <button type="button" className="btn" onClick={() => funZoneImageInputRef.current?.click()}>
                    {funZoneForm.riddle?.[0]?.image_url ? "Change Photo" : "Upload Photo"}
                  </button>
                  <input ref={funZoneImageInputRef} type="file" accept="image/*" onChange={handleFunZoneImagePick} style={{ display: "none" }} />
                </div>
                {funZoneForm.riddle?.[0]?.image_url && (
                  <div style={{ position: "relative", width: "fit-content" }}>
                    <img src={funZoneForm.riddle[0].image_url} alt="Preview" style={{ height: "60px", borderRadius: "8px", border: "1px solid var(--border)" }} />
                    <button 
                      type="button" 
                      onClick={() => setFunZoneForm(c => ({ ...c, riddle: [{ ...c.riddle[0], image_url: "" }] }))}
                      style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer" }}
                    >✕</button>
                  </div>
                )}
              </div>
            </div>

            {/* Rumor */}
            <div className="card" style={{ background: "rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>Transfer Rumor Mill</h3>
              <input className="form-input" placeholder="Rumor Text" value={funZoneForm.rumor?.[0]?.text || ""} onChange={e => setFunZoneForm({ ...funZoneForm, rumor: [{ ...funZoneForm.rumor[0], text: e.target.value }] })} style={{ marginBottom: "12px" }} />
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span className="muted" style={{ fontSize: "12px" }}>Starting Votes:</span>
                <input type="number" className="form-input" placeholder="Hot Votes" value={funZoneForm.rumor?.[0]?.votes?.hot ?? 0} onChange={e => setFunZoneForm({ ...funZoneForm, rumor: [{ ...funZoneForm.rumor[0], votes: { ...funZoneForm.rumor[0].votes, hot: parseInt(e.target.value) || 0 } }] })} style={{ width: "100px" }} />
                <input type="number" className="form-input" placeholder="Not Votes" value={funZoneForm.rumor?.[0]?.votes?.not ?? 0} onChange={e => setFunZoneForm({ ...funZoneForm, rumor: [{ ...funZoneForm.rumor[0], votes: { ...funZoneForm.rumor[0].votes, not: parseInt(e.target.value) || 0 } }] })} style={{ width: "100px" }} />
              </div>
            </div>

            {/* Charades */}
            <div className="card" style={{ background: "rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>🕵️ Emoji Charades</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input className="form-input" placeholder="Clues" value={funZoneForm.charades?.[0]?.emojis || ""} onChange={e => setFunZoneForm({ ...funZoneForm, charades: [{ ...funZoneForm.charades[0], emojis: e.target.value }] })} />
                <input className="form-input" placeholder="Answer Name" value={funZoneForm.charades?.[0]?.answer || ""} onChange={e => setFunZoneForm({ ...funZoneForm, charades: [{ ...funZoneForm.charades[0], answer: e.target.value }] })} />
              </div>
            </div>

            {/* On This Day */}
            <div className="card" style={{ background: "rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>On This Day</h3>
              <textarea className="form-input" rows={2} placeholder="Historical fact..." value={funZoneForm.on_this_day?.fact || ""} onChange={e => setFunZoneForm({ ...funZoneForm, on_this_day: { ...funZoneForm.on_this_day, fact: e.target.value } })} />
            </div>

            {/* Prediction */}
            <div className="card" style={{ background: "rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>Bold Prediction</h3>
              <input className="form-input" placeholder="Prediction Question" value={funZoneForm.prediction?.[0]?.question || ""} onChange={e => setFunZoneForm({ ...funZoneForm, prediction: [{ ...funZoneForm.prediction[0], question: e.target.value }] })} style={{ marginBottom: "12px" }} />
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span className="muted" style={{ fontSize: "12px" }}>Starting Votes:</span>
                <input type="number" className="form-input" placeholder="Yes" value={funZoneForm.prediction?.[0]?.votes?.yes ?? 0} onChange={e => setFunZoneForm({ ...funZoneForm, prediction: [{ ...funZoneForm.prediction[0], votes: { ...funZoneForm.prediction[0].votes, yes: parseInt(e.target.value) || 0 } }] })} style={{ width: "100px" }} />
                <input type="number" className="form-input" placeholder="No" value={funZoneForm.prediction?.[0]?.votes?.no ?? 0} onChange={e => setFunZoneForm({ ...funZoneForm, prediction: [{ ...funZoneForm.prediction[0], votes: { ...funZoneForm.prediction[0].votes, no: parseInt(e.target.value) || 0 } }] })} style={{ width: "100px" }} />
              </div>
            </div>

          </div>

          <div className="card" style={{ background: "rgba(82, 255, 26, 0.03)", border: "1px solid rgba(82, 255, 26, 0.1)", padding: "16px", borderRadius: "12px", marginTop: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span className="muted" style={{ fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)" }}>
                SCHEDULE FUN ZONE UPDATE
              </span>
              <DatePicker
                selected={funZoneForm.scheduled_at ? new Date(funZoneForm.scheduled_at) : null}
                onChange={(date) => setFunZoneForm({ ...funZoneForm, scheduled_at: date ? date.toISOString() : "" })}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-input"
                placeholderText="Pick update time..."
                autoComplete="off"
                portalId="root-portal"
                popperPlacement="bottom-start"
              />
              <p style={{ fontSize: "11px", margin: 0, color: "var(--muted)", opacity: 0.8 }}>
                Preparing for tomorrow? Set the time here.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
            <button type="button" className="btn-ai" disabled={busy} onClick={handleAutoGenerate}>
              Auto-Generate with AI
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : (funZoneForm.scheduled_at ? "Schedule Config" : "Save Config Now")}
            </button>
          </div>
        </form>
      </div>
      {/* PREMIUM DELETION MODAL */}
      <AnimatePresence>
        {deleteModal.open && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal({ open: false, articleId: null })}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card"
              style={{ 
                position: "relative", 
                width: "min(400px, 100%)", 
                background: "#11141d", 
                border: "1px solid rgba(255, 77, 77, 0.3)", 
                padding: "30px", 
                textAlign: "center",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 20px rgba(255, 77, 77, 0.1)"
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
              <h3 style={{ color: "#fff", marginBottom: "8px" }}>Delete Article?</h3>
              <p className="muted" style={{ fontSize: "14px", marginBottom: "24px" }}>
                This action is permanent and cannot be undone. Are you sure you want to remove this content?
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  className="btn" 
                  style={{ flex: 1, borderColor: "rgba(255,255,255,0.1)" }}
                  onClick={() => setDeleteModal({ open: false, articleId: null })}
                >
                  Cancel
                </button>
                <button 
                  className="btn" 
                  style={{ flex: 1, background: "#ff4d4d", color: "white", border: "none", fontWeight: "700" }}
                  onClick={confirmDeleteArticle}
                  disabled={busy}
                >
                  {busy ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default AdminPage;
