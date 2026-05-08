import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "../components/ScrambleText";
import RevealSection from "../components/RevealSection";
import Tilt from "react-parallax-tilt";

const CREATORS = [
  {
    id: 1,
    name: "Bhavya Arora",
    role: "YjR",
    color: "#ffffff", // Real Madrid White
    bio: "Today the Indian Football Community is rapidly growing and touching new heights. But have you ever thought who was the first person to start this all. Yes it's none other than Bhavya Arora widely known as YjR. Seasons passed by but one thing stayed constant, his way of analyzing the game. From the past 7 years he has been delivering top-quality work through his analysis and a unique way of supporting his favorite team. This has gained him a loyal audience of over 550k+ people which consistes of over 320k+ YouTube subscribers and 230k Instagram followers.",
    youtube: "https://www.youtube.com/@yashyjr",
    image: "/creator3_new.png",
  },
  {
    id: 2,
    name: "Divyansh Verma",
    role: "Divyansh",
    color: "#ffffff", // Real Madrid White
    bio: "Divyansh Verma is known to be the biggest creator in India for his favorite team. Started his journey as a YouTube Content Creator in 2021 and has never looked back from then onwards. He is one of the few privileged creators who got the opportunity to showcase himself by working with the Official Instagram page of the club. Talk of numbers and he is amongst the top creators in India with a YouTube subscriber count of more than 419k and having an Instagram following of 147k+. As if these things were not enough and he took Coaching as a quest. Currently he is the Head Coach of College of Engineering Roorkee (C.O.E.R) Men's Football Team.",
    youtube: "https://www.youtube.com/@DivyanshCR7",
    image: "/creator1_new.jpg",
  },
  {
    id: 3,
    name: "Mohak Tripathi",
    role: "ONEMUFC",
    color: "#DA291C", // Man Utd Red
    bio: "Mohak Tripathi, widely known as ONEMUFC is a prominent figure in the Indian Football Community. You might have guessed his favorite football club until now. You guessed it right! He is one of the veterans when it comes to being part of the Official Supporters' Club, New Delhi. He is a die-hard fan creating top-quality content on Youtube since 2021 with a YouTube subscriber count of more than 130k and having an Instagram following of more than 60k.",
    youtube: "https://www.youtube.com/@ONEMUFC",
    image: "/creator2_new.png",
  },
  {
    id: 4,
    name: "Muktesh Sharma",
    role: "Markaroni",
    color: "linear-gradient(135deg, #004d98 0%, #a50044 100%)", // Red
    bio: "Muktesh Sharma, well known as Markaroni is the biggest football content creator when it comes to India. Yes you heard it right, in India! He has an enormous audience of more than 870k which comprises of more than 630k subscribers on YouTube and more than 230k followers on Instagram. Apart from being the biggest in numbers, he is also one of the few creators who has got the chance of not only working with top leagues but also some of its top players. He has got the chance of having a conversation with French Footballers and legendary Goalkeepers.",
    youtube: "https://www.youtube.com/@Markaroni",
    image: "/creator4_v2.png",
  },
  {
    id: 5,
    name: "Vinayak Sharma",
    role: "Chonkyy",
    color: "linear-gradient(135deg, #004d98 0%, #a50044 100%)", // Barca Blue/Red
    bio: "Vinayak Sharma aka Chonky is considered to be one of the biggest football content creators for his favorite team in India. Started making content on football in 2021, he has come a long way gaining an audience of more than 70k subscribers on Youtube and more than 30k followers on Instagram. Known for his deep and qualitative analysis of the players and their performance on the field, his tactical and statistical analysis is second to none in the community. You will not want to miss out on his tactical analysis.",
    youtube: "https://www.youtube.com/@Chonkyy",
    image: "/creator5_new.png",
  }
];

export default function AboutPage() {
  const [selectedCreator, setSelectedCreator] = useState(null);

  return (
    <div className="about-page" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── HERO SECTION ── */}
      <section className="about-hero" style={{
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        padding: "0 20px"
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          style={{
            position: "absolute",
            width: "60vw",
            height: "60vw",
            background: "radial-gradient(circle, rgba(82, 255, 26, 0.05) 0%, transparent 70%)",
            filter: "blur(80px)",
            zIndex: 0
          }}
        />

        <h1 style={{ fontSize: "clamp(48px, 8vw, 120px)", lineHeight: "0.9", marginBottom: "24px", zIndex: 1 }}>
          <ScrambleText text="WE ARE " speed={0.5} />
          <span className="brand-accent">
            <ScrambleText text="CHAOS CLUB" speed={0.5} delay={0.3} />
          </span>
        </h1>
        <p className="muted" style={{ fontSize: "clamp(16px, 2vw, 24px)", maxWidth: "800px", zIndex: 1 }}>
          A collective of India's biggest football creators, bringing the passion, the tactics, and the chaos of the pitch to your screens.
        </p>
      </section>

      {/* ── CREATORS MOSAIC ── */}
      <RevealSection className="section" style={{ paddingBottom: "100px" }}>
        <div className="section-eyebrow">Meet The Team</div>
        <h2 className="section-title">THE CREATORS MOSAIC</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "30px",
          marginTop: "50px"
        }}>
          {CREATORS.map((c) => (
            <div key={c.id} onClick={() => setSelectedCreator(c)} style={{ cursor: "pointer" }}>
              <Tilt
                tiltMaxAngleX={10}
                tiltMaxAngleY={10}
                scale={1.05}
                transitionSpeed={2500}
                style={{ height: "100%" }}
              >
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "24px",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ffffff55";
                    e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 20px #ffffff22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "16px",
                    overflow: "hidden",
                    marginBottom: "20px",
                    background: "var(--surface-2)",
                    position: "relative"
                  }}>
                    <img src={c.image} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <h3 style={{ fontSize: "24px", fontFamily: "Bebas Neue", letterSpacing: "0.05em", margin: "0 0 4px" }}>{c.name}</h3>
                  <div style={{ color: "var(--accent)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{c.role}</div>
                </div>
              </Tilt>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ── MISSION REVEAL ── */}
      <RevealSection className="section" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "rgba(6, 7, 12, 0.95)",
        overflow: "hidden"
      }}>
        {/* Background Image / Mask Placeholder */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/creators_group.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
          filter: "grayscale(100%)",
          zIndex: 0
        }} />

        <div style={{ maxWidth: "800px", position: "relative", zIndex: 1, textAlign: "center", padding: "0 20px" }}>
          <div className="section-eyebrow" style={{ color: "var(--accent)" }}>Our DNA</div>
          <h2 className="section-title" style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: "0.9" }}>THE MISSION</h2>
          <div style={{ fontSize: "18px", lineHeight: "1.8", color: "var(--text)", marginTop: "32px" }}>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)", marginBottom: "24px" }}>
              Bringing Football to Life, One Video at a Time.
            </p>
            <p>
              At Chaos Club, our mission is simple yet powerful: to create a space where football fans from every corner of the world
              can come together to celebrate, debate, and experience the beautiful game in its rawest, most authentic form.
            </p>
            <p style={{ marginTop: "20px" }}>
              We believe football is more than just 90 minutes on the pitch – it's the emotions, the stories, the rivalries, and
              the unforgettable moments that unite millions. Our goal is to capture that magic and deliver it to you through
              high-quality, engaging content that keeps you connected to the sport you love.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "40px", textAlign: "left" }}>
            {[
              { title: "Unfiltered Passion", desc: "We don't just report on football; we live it." },
              { title: "Global Community", desc: "Uniting fans from every league and background." },
              { title: "Authentic Stories", desc: "No clickbait. Just real football culture." }
            ].map(item => (
              <div key={item.title} style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(82, 255, 26, 0.2)" }}>
                <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: "14px", marginBottom: "8px", textTransform: "uppercase" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── SOCIALS CALL TO ACTION ── */}
      <RevealSection className="section" style={{ textAlign: "center", padding: "100px 20px" }}>
        <h2 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontFamily: "Bebas Neue", marginBottom: "20px" }}>JOIN THE CHAOS</h2>
        <div style={{ display: "flex", gap: "40px", justifyContent: "center", alignItems: "center", marginTop: "40px" }}>
          <a 
            href="https://www.youtube.com/@ChaosClub.Official" 
            target="_blank" 
            rel="noreferrer"
            style={{ transition: "transform 0.3s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
              <path fill="#FF0000" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </a>
          <a 
            href="https://www.instagram.com/chaosclub.uh/" 
            target="_blank" 
            rel="noreferrer"
            style={{ transition: "transform 0.3s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="ig-grad-main" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: "#f09433", stopOpacity: 1 }} />
                  <stop offset="25%" style={{ stopColor: "#e6683c", stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: "#dc2743", stopOpacity: 1 }} />
                  <stop offset="75%" style={{ stopColor: "#cc2366", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#bc1888", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path fill="url(#ig-grad-main)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
      </RevealSection>

      {/* ── CREATOR MODAL ── */}
      <AnimatePresence>
        {selectedCreator && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCreator(null)}
            style={{ zIndex: 10001 }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "900px",
                width: "95%",
                maxHeight: "85vh",
                overflowY: "auto",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
                textAlign: "left",
                padding: "0",
                background: "#0a0c14"
              }}
            >
              <div style={{ display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
                <div style={{
                  flex: window.innerWidth < 768 ? "none" : "0 0 40%",
                  background: selectedCreator.color.includes("gradient") ? selectedCreator.color : `linear-gradient(135deg, ${selectedCreator.color}33, #000)`,
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center"
                }}>
                  <img
                    src={selectedCreator.image}
                    alt={selectedCreator.name}
                    style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 0 30px rgba(0,0,0,0.5))" }}
                  />
                </div>
                <div style={{ flex: 1, padding: "40px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ fontSize: "42px", fontFamily: "Bebas Neue", color: "var(--accent)", margin: 0 }}>{selectedCreator.name}</h2>
                      <div style={{ color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", fontSize: "14px", letterSpacing: "0.1em" }}>{selectedCreator.role}</div>
                    </div>
                    <button className="btn" onClick={() => setSelectedCreator(null)} style={{ padding: "8px 12px", minWidth: "auto" }}>✕</button>
                  </div>

                  <div style={{ marginTop: "24px", fontSize: "16px", lineHeight: "1.7", color: "rgba(255,255,255,0.8)" }}>
                    {selectedCreator.bio}
                  </div>

                  <div style={{ marginTop: "32px", display: "flex", gap: "24px", alignItems: "center" }}>
                    <a 
                      href={selectedCreator.youtube} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ transition: "transform 0.3s ease" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24">
                        <path fill="#FF0000" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

