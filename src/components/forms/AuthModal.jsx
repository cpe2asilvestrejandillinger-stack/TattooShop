import './AuthModal.css'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from 'lucide-react'

export default function AuthModal(props) {
  const {
    authModal,
    setAuthModal,
    closeAuthModal = () => setAuthModal(null),
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authName,
    setAuthName,
    authError,
    authMessage,
    authLoading,
    handleAuthSubmit,
    handlePasswordReset,
    handleGoogleSignIn,
  } = props
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  useEffect(() => {
    if (!authModal) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeAuthModal()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [authModal, closeAuthModal])

  if (!authModal) return null

  const isRegistering = authModal === 'register'
  const isResettingPassword = authModal === 'reset-password'
  const title = isResettingPassword
    ? 'Set New Password'
    : isRegistering
      ? 'Create Account'
      : 'Welcome Back'
  const subtitle = isResettingPassword
    ? 'Choose a new password for your account.'
    : isRegistering
      ? 'Create an account to book your next tattoo.'
      : 'Log in to your account.'

  return (
    <div
      className="auth-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAuthModal()
      }}
    >
      <section
        className="auth-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          onClick={closeAuthModal}
          className="auth-modal-close"
          aria-label="Close sign-in dialog"
        >
          <X size={20} />
        </button>

        <header className="auth-modal-heading">
          <h2 id="auth-modal-title">{title}</h2>
          <p>{subtitle}</p>
        </header>

        <form onSubmit={handleAuthSubmit} className="auth-modal-form">
          {isRegistering && (
            <label className="auth-modal-field">
              <UserRound size={19} aria-hidden="true" />
              <input
                type="text"
                required
                autoComplete="name"
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
                placeholder="Full name"
              />
            </label>
          )}

          {!isResettingPassword && (
            <label className="auth-modal-field">
              <Mail size={19} aria-hidden="true" />
              <input
                type="email"
                required
                autoComplete="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="Email address"
              />
            </label>
          )}

          <label className="auth-modal-field">
            <LockKeyhole size={19} aria-hidden="true" />
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              required
              autoComplete={isRegistering || isResettingPassword ? 'new-password' : 'current-password'}
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder={isResettingPassword ? 'New password' : 'Password'}
              minLength={6}
            />
            <button
              type="button"
              className="auth-modal-password-toggle"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </label>

          {!isRegistering && !isResettingPassword && (
            <div className="auth-modal-forgot-row">
              <button type="button" onClick={handlePasswordReset} disabled={authLoading}>
                Forgot password?
              </button>
            </div>
          )}

          {(authError || authMessage) && (
            <p className={authError ? 'auth-modal-message is-error' : 'auth-modal-message is-success'} role="status">
              {authError || authMessage}
            </p>
          )}

          <button disabled={authLoading} type="submit" className="auth-modal-submit">
            {authLoading
              ? 'Please wait...'
              : isResettingPassword
                ? 'Update Password'
                : isRegistering
                  ? 'Create Account'
                  : 'Log In'}
          </button>
          {!isResettingPassword && (
            <>
              <div className="auth-modal-divider" aria-hidden="true"><span>or</span></div>
              <button
                type="button"
                className="auth-modal-google-button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
              >
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15z" />
                  <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44z" />
                  <path fill="#FBBC05" d="M12.8 27.8a12 12 0 0 1 0-7.6V15H5.9a20 20 0 0 0 0 18z" />
                  <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.9 15l6.9 5.2C14.4 15.5 18.8 12 24 12z" />
                </svg>
                {authLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
            </>
          )}
        </form>

        <div className="auth-modal-switch">
          {isResettingPassword ? (
            <button type="button" onClick={() => setAuthModal('login')}>
              Back to Log In
            </button>
          ) : isRegistering ? (
            <p>Already have an account? <button type="button" onClick={() => setAuthModal('login')}>Log In</button></p>
          ) : (
            <p>Don't have an account? <button type="button" onClick={() => setAuthModal('register')}>Sign Up</button></p>
          )}
        </div>
      </section>
    </div>
  )
}
