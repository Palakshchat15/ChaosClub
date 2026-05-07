import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger } from "../lib/animations";
import RevealSection from "../components/RevealSection";

function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const headingRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const payload = await api.get("/api/articles");
        setArticles(payload);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // GSAP heading reveal
  useEffect(() => {
    if (headingRef.current) {
      gsap.fromTo(headingRef.current,
        { opacity: 0, y: 40, skewY: 2 },
        { opacity: 1, y: 0, skewY: 0, duration: 0.8, ease: "power3.out" }
      );
    }
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <RevealSection className="section">
      <div className="section-eyebrow">Daily Updates</div>
      <h1 ref={headingRef} className="section-title" style={{ opacity: 0 }}>THE NEWS FEED</h1>
      {loading ? <div className="empty-state">Loading articles...</div> : null}
      {error ? <div className="empty-state">{error}</div> : null}
      {!loading && !error && articles.length === 0 ? (
        <div className="empty-state">No articles yet. Admins can publish the first story from the panel.</div>
      ) : null}
      {!loading && !error && articles.length > 0 ? (
        <motion.div 
          className="grid grid-news"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {articles.map((article) => (
            <motion.div key={article.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} style={{ height: '100%' }}>
              <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2500} style={{ height: '100%' }}>
                <Link to={`/news/${article.id}`} style={{ display: 'block', height: '100%' }}>
                  <article className="card" style={{ height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                    <div className="article-thumb-wrap" style={{ 
                      width: "100%", 
                      aspectRatio: "16/9", 
                      backgroundColor: "rgba(0,0,0,0.3)", 
                      overflow: "hidden", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      borderBottom: "1px solid var(--border)"
                    }}>
                      {article.image_url ? (
                        <img 
                          src={article.image_url} 
                          alt={article.title} 
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
                        />
                      ) : null}
                    </div>
                    <h2 style={{ flexGrow: 1 }}>{article.title}</h2>
                    <div className="article-meta">
                      {article.author} • {new Date(article.created_at).toLocaleDateString()}
                    </div>
                    <p className="muted">{article.excerpt}</p>
                  </article>
                </Link>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </RevealSection>
  );
}

export default NewsPage;
