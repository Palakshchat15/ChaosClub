import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { api } from "../lib/api";
import { setAuth } from "../lib/auth";
import { uploadImage } from "../lib/uploadImage";
import { motion, AnimatePresence } from "framer-motion";
import AuthCharacter from "../components/AuthCharacter";

function SignupPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPasswordActive, setIsPasswordActive] = useState(false);
  const fileInputRef = useRef(null);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setBusy("Sending code...");
    try {
      await api.post("/api/auth/send-verification-code", { email });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");
    setBusy("Verifying...");
    try {
      await api.post("/api/auth/verify-code", { email, code });
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleFinalSignup(event) {
    event.preventDefault();
    setError("");
    setBusy("Creating account...");
    try {
      // Step 1: Register the user
      const payload = await api.post("/api/auth/register", { name, email, password });
      
      // Step 2: If avatar was selected, upload it to Cloudinary then save URL
      if (avatarFile) {
        setBusy("Uploading photo...");
        try {
          const avatarUrl = await uploadImage(avatarFile, "avatars");
          await api.post(`/api/users/${payload.user_id}/avatar`, { avatar_url: avatarUrl });
          payload.avatar_url = avatarUrl;
        } catch {
          // Avatar upload failure is non-fatal
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        setAuth(payload);
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="section">
      <div className="auth-shell" style={{ textAlign: "center", maxWidth: "400px" }}>
        <AuthCharacter 
          isPasswordActive={isPasswordActive} 
          emailLength={email.length} 
          isBusy={!!busy}
          hasError={!!error}
          isSuccess={isSuccess}
          hasAvatar={!!avatarPreview}
        />
        <div className="section-eyebrow">
          {step === 1 ? "Step 1: Email" : step === 2 ? "Step 2: Verify" : "Step 3: Profile"}
        </div>
        <h1 style={{ marginTop: 0 }}>JOIN THE CLUB</h1>

        <div className="wizard-progress" style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ 
              width: '40px', height: '4px', borderRadius: '2px', 
              background: s <= step ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendCode}
            >
              <p className="muted" style={{ marginBottom: '20px' }}>Enter your email to receive a verification code.</p>
              <div className="form-field">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  className="form-input" id="email" type="email" placeholder="you@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
              </div>
              {error ? <p className="error-text">{error}</p> : null}
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={!!busy}>
                {busy || "Send Verification Code"}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyCode}
            >
              <p className="muted" style={{ marginBottom: '20px' }}>We sent a 6-digit code to <b>{email}</b></p>
              <div className="form-field">
                <label className="form-label" htmlFor="code">Verification Code</label>
                <input
                  className="form-input" id="code" type="text" placeholder="123456" maxLength={6}
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '4px' }}
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required
                />
              </div>
              {error ? <p className="error-text">{error}</p> : null}
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={!!busy}>
                {busy || "Verify Code"}
              </button>
              <button type="button" className="btn" style={{ width: "100%", marginTop: "8px", background: 'transparent' }} onClick={() => setStep(1)}>
                Change Email
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleFinalSignup}
            >
              {/* Avatar Upload */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "80px", height: "80px", borderRadius: "50%",
                    border: "2px dashed var(--accent)",
                    background: avatarPreview ? "transparent" : "rgba(82, 255, 26, 0.05)",
                    cursor: "pointer", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>Upload</span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  className="form-input" id="name" type="text" placeholder="John Doe"
                  value={name} onChange={(e) => setName(e.target.value)} required
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="password">Create Password (min 6)</label>
                <input
                  className="form-input" id="password" type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordActive(true)}
                  onBlur={() => setIsPasswordActive(false)}
                  required
                />
              </div>
              {error ? <p className="error-text">{error}</p> : null}
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={!!busy}>
                {busy || "Complete Signup"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="muted" style={{ marginTop: '24px' }}>
          Already a fan? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}

export default SignupPage;
