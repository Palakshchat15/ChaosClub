import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api";
import { setAuth } from "../lib/auth";
import AuthCharacter from "../components/AuthCharacter";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPasswordActive, setIsPasswordActive] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    setIsSuccess(false);
    try {
      const payload = await api.post("/api/auth/login", { email, password });
      setIsSuccess(true);
      setTimeout(() => {
        setAuth(payload);
        window.location.href = "/";
      }, 1000); // Give time for success animation
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="auth-shell" style={{ textAlign: 'center' }}>
        <AuthCharacter 
          isPasswordActive={isPasswordActive} 
          emailLength={email.length} 
          isBusy={busy}
          hasError={!!error}
          isSuccess={isSuccess}
        />
        
        <div className="section-eyebrow">Secure Access</div>
        <h1 style={{ marginTop: 0 }}>LOG IN</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              className="form-input"
              id="email"
              type="email"
              placeholder="you@chaosclub.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              className="form-input"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setIsPasswordActive(true)}
              onBlur={() => setIsPasswordActive(false)}
              required
            />
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={busy}>
            {busy ? "Logging in..." : "Enter The Club"}
          </button>
        </form>
        <p className="muted">
          No account? <Link to="/signup">Join the Chaos</Link>
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
