import { useState } from 'react'
import { supabase } from './lib/supabase'
import backgroundImage from './assets/artist.jpg'
import LandingPage from './LandingPage'
import './App.css'

function App() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState('landing')

  const openSignUp = () => {
    setIsSignUp(true)
    setMessage('')
    setCurrentPage('auth')
  }

  const openLogin = () => {
    setIsSignUp(false)
    setMessage('')
    setCurrentPage('auth')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) throw error

        setMessage('Account created! Please check your email to verify your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessage('Login successful!')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }
 
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onGetStarted={openSignUp}
        onLogin={openLogin}
      />
    )
  }
  const isSuccessMessage =
    message.toLowerCase().includes('successful') ||
    message.toLowerCase().includes('created')

  return (
    <div className="app-container">
      {/* Left visual section */}
      <div className="hero-section">
        <img
          src={backgroundImage}
          alt="Tattoo artist working on a tattoo"
          className="hero-bg-image"
        />

        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="brand">
            <div className="brand-icon">A</div>
            <span className="brand-text">
              Air<span className="brand-accent">Wizard</span>
            </span>
          </div>

          <div className="hero-body">
            <p className="hero-tagline">Art that stays with you</p>

            <h1 className="hero-heading">
              Your story.
              <br />
              Your skin.
              <br />
              <span className="brand-accent">Your art.</span>
            </h1>

            <p className="hero-description">
              Discover unique tattoo designs and book your next appointment with ease.
            </p>

            <div className="hero-footer-tag">
              <div className="divider-line" />
              <span className="tag-text">Designed for self-expression</span>
            </div>
          </div>

          <p className="copyright-text">
            © 2026 AirWizard. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right authentication section */}
      <div className="auth-section">
        <div className="auth-card">
          {/* Mobile logo */}
          <div className="mobile-brand">
            <div className="brand">
              <div className="brand-icon small">A</div>
              <span className="brand-text">
                Air<span className="brand-accent">Wizard</span>
              </span>
            </div>
          </div>

          <div className="auth-header">
            <p className="auth-subtitle">
              {isSignUp ? 'Join our community' : 'Welcome back'}
            </p>

            <h2 className="auth-title">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>

            <p className="auth-description">
              {isSignUp
                ? 'Create an account to start your tattoo journey.'
                : 'Enter your details to access your account.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                minLength={6}
                required
                className="form-input"
              />
            </div>

            {message && (
              <div className={`message-box ${isSuccessMessage ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading
                ? 'Please wait...'
                : isSignUp
                ? 'Create Account'
                : 'Sign In'}
            </button>
          </form>

          {/* Switch form toggle */}
          <div className="switch-form">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage('')
              }}
              className="toggle-btn"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <p className="terms-text">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App