import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link to="/" className="brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src="/logo_transparent.png"
              alt="Chaos Club"
              style={{ height: "32px", width: "auto", objectFit: "contain" }}
            />
            <span>CHAOS<span className="brand-accent">CLUB</span></span>
          </Link>
          <p className="muted">
            The official fan arena of the ChaosClub YouTube channel.
          </p>
        </div>
        <div>
          <div className="footer-col-title">Explore</div>
          <div className="footer-links">
            <Link to="/news">Daily News</Link>
            <Link to="/predict">Match Predictions</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>
        </div>
        <div>
          <div className="footer-col-title">Follow The Chaos</div>
          <div className="footer-links">
            <a href="https://www.youtube.com/@ChaosClub.Official" target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href="https://www.instagram.com/chaosclub.uh/" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer">
              X / Twitter
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Chaos Club - Built for fans, by fans</div>
    </footer>
  );
}

export default Footer;
