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
