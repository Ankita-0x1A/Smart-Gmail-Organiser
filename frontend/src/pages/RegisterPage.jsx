import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const isPasswordValid = password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-blob" />
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Mail size={22} />
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Get started with Smart Gmail Organizer</p>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-name">
              Full Name
            </label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                id="register-name"
                type="text"
                className="auth-input"
                placeholder="Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">
              Email Address
            </label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="register-email"
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-password">
              Password
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div
              className="auth-password-hint"
              style={{
                color: password.length > 0 && isPasswordValid ? "var(--color-success)" : "var(--text-dim)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {password.length > 0 && isPasswordValid && <CheckCircle2 size={12} />}
              <span>Password must be at least 8 characters</span>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="spin-icon" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
