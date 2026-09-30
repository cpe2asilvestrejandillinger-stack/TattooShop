import { useState } from 'react'
import './LandingPage.css'

function LandingPage({ onGetStarted, onLogin }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="landing-page">

      {/* Navigation Bar */}
      <nav className="landing-nav">
        <a href="#home" className="landing-logo" onClick={closeMenu}>
          <span className="logo-icon">A</span>
          <span>
            Air<span className="purple-text">Wizard</span>
          </span>
        </a>

        {/* Hamburger Toggle Button (Mobile) */}
        <button
          className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>

        {/* Combined Links & Buttons Container */}
        <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#gallery" onClick={closeMenu}>Gallery</a>
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </div>

          <div className="nav-buttons">
            <button
              className="nav-login"
              onClick={() => {
                closeMenu()
                onLogin()
              }}
            >
              Login
            </button>
            <button
              className="nav-start"
              onClick={() => {
                closeMenu()
                onGetStarted()
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" id="home">
        <div className="hero-background" />

        <div className="landing-hero-content">
          <span className="hero-label">
            ART THAT STAYS WITH YOU
          </span>

          <h1>
            Your Story.
            <br />
            Your Skin.
            <br />
            <span className="purple-text">Your Art.</span>
          </h1>

          <p>
            Every tattoo tells a story. Discover unique designs,
            express your individuality, and make your next piece
            something truly personal.
          </p>

          <div className="hero-actions">
            <button className="primary-button" onClick={onGetStarted}>
              Book Your Appointment <span>→</span>
            </button>

            <a href="#gallery" className="secondary-button">
              Explore Designs
            </a>
          </div>

          <div className="hero-note">
            <span className="note-line" />
            <span>Designed for self-expression</span>
          </div>
        </div>

        <div className="hero-scroll">
          SCROLL TO EXPLORE
          <span>↓</span>
        </div>
      </section>

      {/* Introduction */}
      <section className="intro-section" id="about">
        <div className="section-label">WELCOME TO AIRWIZARD</div>

        <h2>
          More than ink.
          <br />
          <span className="purple-text">A piece of who you are.</span>
        </h2>

        <p>
          We believe tattoos are more than just designs on skin.
          They represent memories, personal journeys, and stories
          worth carrying forever. Our goal is to help you turn
          your ideas into meaningful works of art.
        </p>
      </section>

      {/* Gallery */}
      <section className="gallery-section" id="gallery">
        <div className="section-heading">
          <div>
            <span className="section-label">OUR PORTFOLIO</span>
            <h2>Featured <span className="purple-text">Designs</span></h2>
          </div>

          <p>
            Explore different styles and find inspiration
            for your next tattoo.
          </p>
        </div>

        <div className="gallery-grid">
          <div className="gallery-card gallery-large">
            <img
              src="/images/design-1.jpg"
              alt="Featured tattoo design"
            />
            <div className="gallery-caption">
              <span>01 / FEATURED WORK</span>
              <h3>Fine Line Art</h3>
            </div>
          </div>

          <div className="gallery-card">
            <img
              src="/images/design-2.jpg"
              alt="Blackwork tattoo design"
            />
            <div className="gallery-caption">
              <span>02 / PORTFOLIO</span>
              <h3>Blackwork</h3>
            </div>
          </div>

          <div className="gallery-card">
            <img
              src="/images/design-3.jpg"
              alt="Minimalist tattoo design"
            />
            <div className="gallery-caption">
              <span>03 / PORTFOLIO</span>
              <h3>Minimalist</h3>
            </div>
          </div>
        </div>

        <div className="gallery-action">
          <button className="outline-button" onClick={onGetStarted}>
            Explore More Designs →
          </button>
        </div>
      </section>

      {/* Services */}
      <section className="services-section" id="services">
        <div className="section-heading centered-heading">
          <span className="section-label">WHAT WE OFFER</span>
          <h2>Our <span className="purple-text">Services</span></h2>
          <p>
            From simple ideas to custom artwork, we help bring
            your vision to life.
          </p>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <div className="service-number">01</div>
            <h3>Custom Tattoos</h3>
            <p>
              Personalized designs created around your ideas,
              preferences, and story.
            </p>
          </div>

          <div className="service-card">
            <div className="service-number">02</div>
            <h3>Fine Line Tattoos</h3>
            <p>
              Detailed and delicate artwork with clean lines
              and a minimalist appearance.
            </p>
          </div>

          <div className="service-card">
            <div className="service-number">03</div>
            <h3>Tattoo Consultation</h3>
            <p>
              Discuss your ideas, placement, and design
              preferences before your appointment.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Process */}
      <section className="process-section">
        <div className="section-heading centered-heading">
          <span className="section-label">SIMPLE AND EASY</span>
          <h2>How It <span className="purple-text">Works</span></h2>
          <p>
            Your next tattoo is only a few steps away.
          </p>
        </div>

        <div className="process-grid">
          <div className="process-card">
            <span>01</span>
            <h3>Create an Account</h3>
            <p>Register to access your personal booking dashboard.</p>
          </div>

          <div className="process-card">
            <span>02</span>
            <h3>Choose Your Design</h3>
            <p>Browse available designs or select a service.</p>
          </div>

          <div className="process-card">
            <span>03</span>
            <h3>Request an Appointment</h3>
            <p>Submit your preferred date and tattoo details.</p>
          </div>

          <div className="process-card">
            <span>04</span>
            <h3>Wait for Confirmation</h3>
            <p>Check your account for updates from the artist.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <span className="section-label">YOUR STORY STARTS HERE</span>

        <h2>
          Ready to make your
          <br />
          <span className="purple-text">mark?</span>
        </h2>

        <p>
          Turn your ideas into something you can carry
          with you forever.
        </p>

        <button className="primary-button" onClick={onGetStarted}>
          Start Your Tattoo Journey →
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer" id="contact">
        <div className="footer-top">
          <a href="#home" className="landing-logo">
            <span className="logo-icon">A</span>
            <span>
              Air<span className="purple-text">Wizard</span>
            </span>
          </a>

          <p>Art that stays with you.</p>

          <button className="footer-login" onClick={onLogin}>
            Login to Your Account →
          </button>
        </div>

        <div className="footer-bottom">
          <span>© 2026 AirWizard. All rights reserved.</span>
          <span>Made for self-expression.</span>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage