import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger } from "../lib/animations";
import GlitchText from "../components/GlitchText";
import TypeWriter from "../components/TypeWriter";
import Magnetic from "../components/Magnetic";
import AnimatedNumber from "../components/AnimatedNumber";
import ScrambleText from "../components/ScrambleText";
import RevealSection from "../components/RevealSection";


const STATS = [
  { label: "Fans Competing", value: "1,200+" },
  { label: "Matches Predicted", value: "340+" },
  { label: "Daily Articles", value: "5+" },
  { label: "Leaderboard Prizes", value: "Monthly" },
];

function HomePage() {
  const [articles, setArticles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leaders, setLeaders] = useState([]);

  const logoRef = useRef(null);
  const eyebrowRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroCtaRef = useRef(null);
  const statsRef = useRef(null);
  const newsSectionRef = useRef(null);
  const sidebarRef = useRef(null);
  const gridBgRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [articlesPayload, matchesPayload, leadersPayload] = await Promise.all([
          api.get("/api/articles"),
          api.get("/api/matches/upcoming"),
          api.get("/api/leaderboard?scope=all_time"),
        ]);
        setArticles(articlesPayload.slice(0, 3));
        setMatches(matchesPayload);
        setLeaders(leadersPayload.slice(0, 3));
      } catch {
        // silently fail — hero still renders
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(logoRef.current,
      { scale: 0.4, opacity: 0, rotation: -12 },
      { scale: 1, opacity: 1, rotation: 0, duration: 0.9 }
    )
    .fromTo(eyebrowRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 }, "-=0.35"
    )
    .fromTo(heroTitleRef.current,
      { opacity: 0, y: 55, skewY: 5 },
      { opacity: 1, y: 0, skewY: 0, duration: 1 }, "-=0.2"
    )
    .fromTo(heroSubRef.current,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6 }, "-=0.4"
    )
    .fromTo(heroCtaRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5 }, "-=0.35"
    )
    .fromTo(statsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 }, "-=0.3"
    );

    gsap.fromTo(newsSectionRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: newsSectionRef.current, start: "top 85%", toggleActions: "play none none none" },
      }
    );
    gsap.fromTo(sidebarRef.current,
      { opacity: 0, x: 40 },
      {
        opacity: 1, x: 0, duration: 0.8, ease: "power3.out", delay: 0.1,
        scrollTrigger: { trigger: sidebarRef.current, start: "top 85%", toggleActions: "play none none none" },
      }
    );

    // Deep Scroll Parallax for Grid
    gsap.to(gridBgRef.current, {
      y: 200,
      ease: "none",
      scrollTrigger: {
        trigger: ".home-hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });

    gsap.to(".scroll-progress-element", {
      x: "-50vw",
      y: "30vh",
      rotation: 360,
      scale: 1.5,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      }
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  const nextMatch = matches[0];

  return (
    <>
      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="home-hero">
        {/* Animated background grid */}
        <div ref={gridBgRef} className="hero-grid-bg" aria-hidden="true" />
        
        {/* Progress-linked floating element */}
        <div className="scroll-progress-element" style={{
          position: "fixed",
          top: "20%",
          right: "-10%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(82, 255, 26, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          zIndex: -1,
          pointerEvents: "none"
        }} />

        <img
          ref={logoRef}
          src="/logo_transparent.png"
          alt="Chaos Club"
          className="hero-logo logo-3d"
          style={{ opacity: 0 }}
        />

        <div ref={eyebrowRef} className="section-eyebrow" style={{ opacity: 0 }}>
          <ScrambleText text="Official Fan HQ Of ChaosClub" speed={0.4} />
        </div>

        <h1 ref={heroTitleRef} className="hero-title" style={{ opacity: 0 }}>
          <ScrambleText text="WHERE " speed={0.6} />
          <GlitchText as="span" className="accent">
            <ScrambleText text="CHAOS" speed={0.8} />
          </GlitchText>
          <ScrambleText text=" MEETS THE PITCH." speed={0.6} delay={0.2} />
        </h1>

        <p ref={heroSubRef} className="hero-subtitle" style={{ opacity: 0 }}>
          Predict results, climb the monthly leaderboard, read daily football
          news and unlock a fun fact every day.
        </p>

        <div ref={heroCtaRef} className="hero-cta" style={{ opacity: 0 }}>
          <Link to="/predict" className="btn btn-primary hero-cta-btn">
            Make A Prediction
          </Link>
          <Link to="/news" className="btn hero-cta-btn">
            Read Latest News
          </Link>
        </div>

        {/* Stats strip */}
        <div ref={statsRef} className="hero-stats" style={{ opacity: 0 }}>
          {STATS.map((s) => (
            <div key={s.label} className="hero-stat">
              <span className="hero-stat-value">
                <AnimatedNumber value={s.value} delay={0.5} />
              </span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CONTENT — articles
      ═══════════════════════════════════════════ */}
      <RevealSection className="section">
        <div ref={newsSectionRef} style={{ opacity: 0 }}>
          <div className="section-eyebrow">Daily Updates</div>
          <h2 className="section-title compact-title">Latest From The Pitch</h2>

          <motion.div
            className="home-article-grid"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
            }}
          >
            {articles.length > 0 ? articles.map((article, i) => (
              <motion.div
                key={article.id}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                style={{ gridColumn: i === 0 ? "1 / -1" : "auto" }}
              >
                <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.015} transitionSpeed={2500}>
                  <Link to={`/news/${article.id}`} className="home-article-card">
                    <div className="home-article-img-wrap">
                      {article.image_url
                        ? <img src={article.image_url} alt={article.title} className="home-article-img" />
                        : <div className="home-article-img-placeholder" />}
                      <div className="home-article-img-overlay" />
                    </div>
                    <div className="home-article-body">
                      <h3 className="home-article-title">{article.title}</h3>
                      {article.excerpt && (
                        <p className="home-article-excerpt muted">{article.excerpt}</p>
                      )}
                      <div className="home-article-meta">
                        <span className="home-article-author">{article.author}</span>
                        <span className="home-article-read">Read →</span>
                      </div>
                    </div>
                  </Link>
                </Tilt>
              </motion.div>
            )) : (
              <div className="empty-state">No articles published yet.</div>
            )}
          </motion.div>

          <Link to="/news" className="btn" style={{ marginTop: "18px", display: "inline-block" }}>
            View All Articles
          </Link>
        </div>

        {/* SIDEBAR — below articles */}
        <div ref={sidebarRef} className="home-sidebar-row" style={{ opacity: 0 }}>

          {/* Match card */}
          <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} transitionSpeed={2000}>
            <div className="card home-match-card">
              <div className="section-eyebrow" style={{ marginBottom: "14px" }}>Next Match</div>
              {nextMatch ? (
                <>
                  <div className="home-match-vs">
                    <div className="home-match-team">{nextMatch.home_team}</div>
                    <div className="home-match-divider">VS</div>
                    <div className="home-match-team">{nextMatch.away_team}</div>
                  </div>
                  <div className="home-match-info">
                    <span>{nextMatch.competition}</span>
                    <span>{new Date(nextMatch.kickoff_at).toLocaleString()}</span>
                  </div>
                  <Link to="/predict" className="btn btn-primary" style={{ display: "block", textAlign: "center", marginTop: "14px" }}>
                    Lock Your Prediction
                  </Link>
                </>
              ) : (
                <>
                  <p className="muted">No upcoming matches yet.</p>
                  <Link to="/predict" className="btn btn-primary" style={{ display: "block", textAlign: "center", marginTop: "10px" }}>
                    Go To Match Centre
                  </Link>
                </>
              )}
            </div>
          </Tilt>

          {/* Leaderboard mini */}
          <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} transitionSpeed={2000}>
            <div className="card">
              <div className="section-eyebrow" style={{ marginBottom: "14px" }}>Top Fans</div>
              <div className="home-leaders">
                {leaders.length > 0 ? leaders.map((row, i) => (
                  <div key={row.rank} className={`home-leader-row ${i === 0 ? "home-leader-first" : ""}`}>
                      <span className="home-leader-rank">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                    <span className="home-leader-name">{row.fan}</span>
                    <span className="home-leader-pts">{row.points} pts</span>
                  </div>
                )) : (
                  <p className="muted" style={{ fontSize: "13px" }}>No leaderboard data yet.</p>
                )}
              </div>
              <Link to="/leaderboard" className="btn" style={{ display: "block", textAlign: "center", marginTop: "14px" }}>
                Full Leaderboard
              </Link>
            </div>
          </Tilt>

        </div>
      </RevealSection>
    </>
  );
}

export default HomePage;
