import './HomePage.css'
import { useEffect, useRef, useState } from 'react'
import artistImage from '../../assets/artist.jpg'
import instagramLogo from '../../assets/iglogo.jpg'
import facebookLogo from '../../assets/fblogo.jpg'
import tiktokLogo from '../../assets/tiktoklogo.jpg'
import { Sparkles, Clock, MapPin, Calendar, ChevronLeft, ChevronRight, LogOut, LayoutDashboard, Menu, X, Phone, MessageCircle } from 'lucide-react'
import { PORTFOLIO_ITEMS } from '../../data/siteData'

const ESTIMATOR_STYLES = [
  { name: 'Fine Line', price: 3000 },
  { name: 'Cyberwork', price: 4500 },
  { name: 'Japanese', price: 5000 },
  { name: 'Ornamental', price: 3500 },
  { name: 'Blackwork', price: 4000 },
]
const ESTIMATOR_SIZES = [
  { name: 'Small (5-10cm)', price: 2000 },
  { name: 'Medium (10-15cm)', price: 4500 },
  { name: 'Large (Sleeve/Thigh)', price: 8500 },
]
const ESTIMATOR_PLACEMENTS = [
  { name: 'Arm / Leg', price: 500 },
  { name: 'Torso', price: 1000 },
  { name: 'Ribs / Neck', price: 1500 },
]

export default function HomePage({ currentUser, openBooking, openBookingWithEstimate, openConversations, handleLogout, setAuthModal, setIsAdminModalOpen, setSelectedImage, estStyle, setEstStyle, estSize, setEstSize, estPlacement, setEstPlacement, flashDesigns = [], flashLoaded = false, onClaimFlash }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [activeNavId, setActiveNavId] = useState('home')
  const pageRef = useRef(null)
  const flashCarouselRef = useRef(null)
  const [canScrollFlashLeft, setCanScrollFlashLeft] = useState(false)
  const [canScrollFlashRight, setCanScrollFlashRight] = useState(false)

  useEffect(() => {
    if (isMobileMenuOpen || !isMobileMenuMounted) return undefined

    const closeDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260
    const closeTimer = window.setTimeout(() => setIsMobileMenuMounted(false), closeDelay)
    return () => window.clearTimeout(closeTimer)
  }, [isMobileMenuOpen, isMobileMenuMounted])

  const flashItems = flashLoaded ? flashDesigns.map((design) => ({
    id: design.id,
    title: design.title,
    description: design.description,
    size: design.size,
    price: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Number(design.price || 0)),
    available: design.is_available,
    img: design.image_url,
  })) : []
  const selectedEstimate = {
    style: ESTIMATOR_STYLES.find((option) => option.price === estStyle)?.name || ESTIMATOR_STYLES[0].name,
    size: ESTIMATOR_SIZES.find((option) => option.price === estSize)?.name || ESTIMATOR_SIZES[0].name,
    placement: ESTIMATOR_PLACEMENTS.find((option) => option.price === estPlacement)?.name || ESTIMATOR_PLACEMENTS[0].name,
  }
  const estimateTotal = estStyle + estSize + estPlacement
  const estimateCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(estimateTotal)

  useEffect(() => {
    const carousel = flashCarouselRef.current
    if (!carousel) return undefined

    const updateArrows = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth
      setCanScrollFlashLeft(carousel.scrollLeft > 2)
      setCanScrollFlashRight(maxScroll - carousel.scrollLeft > 2)
    }

    updateArrows()
    carousel.addEventListener('scroll', updateArrows, { passive: true })
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateArrows) : null
    resizeObserver?.observe(carousel)
    if (!resizeObserver) window.addEventListener('resize', updateArrows)
    return () => {
      carousel.removeEventListener('scroll', updateArrows)
      resizeObserver?.disconnect()
      if (!resizeObserver) window.removeEventListener('resize', updateArrows)
    }
  }, [flashItems.length, flashLoaded])

  const scrollFlashCarousel = (direction) => {
    const carousel = flashCarouselRef.current
    if (!carousel) return

    const card = carousel.querySelector('.home-page__flash-card')
    if (!card) return
    const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0
    carousel.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' })
  }

  useEffect(() => {
    const revealElements = pageRef.current?.querySelectorAll('.scroll-reveal')
    if (!revealElements?.length) return

    const showAll = () => revealElements.forEach((element) => element.classList.add('is-visible'))
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      showAll()
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

    revealElements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <div id="home" ref={pageRef} className="home-page__root">
      <div className="scroll-progress" aria-hidden="true" />

      
      {/* STICKY NAVIGATION BAR */}
      <nav className="home-page__navbar">
        <div className="home-page__brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="home-page__brand-mark">
            <img src={artistImage} alt="AirWizard Tattoo logo" className="home-page__brand-image" />
          </div>
          <div>
            <span className="home-page__brand-name">AirWizard Tattoo</span>
            <span className="home-page__brand-location">Guiguinto, Bulacan</span>
          </div>
        </div>

        <div className="home-page__desktop-nav">
          <a href="#home" className={activeNavId === 'home' ? 'home-page__nav-link is-active' : 'home-page__nav-link'} onClick={() => setActiveNavId('home')}>Home</a>
          <a href="#portfolio" className={activeNavId === 'portfolio' ? 'home-page__nav-link is-active' : 'home-page__nav-link'} onClick={() => setActiveNavId('portfolio')}>Portfolio</a>
          <a href="#estimator" className={activeNavId === 'estimator' ? 'home-page__nav-link is-active' : 'home-page__nav-link'} onClick={() => setActiveNavId('estimator')}>Estimator</a>
          <a href="#flash" className={activeNavId === 'flash' ? 'home-page__nav-link is-active' : 'home-page__nav-link'} onClick={() => setActiveNavId('flash')}>1/1 Flash</a>
          <a href="#location" className={activeNavId === 'location' ? 'home-page__nav-link is-active' : 'home-page__nav-link'} onClick={() => setActiveNavId('location')}>Location</a>
          <a href="#contact" className={activeNavId === 'contact' ? 'home-page__nav-link is-active' : 'home-page__nav-link'} onClick={() => setActiveNavId('contact')}>Contact</a>
        </div>

        <div className="home-page__nav-actions">
          {!currentUser && (
            <div className="home-page__auth-actions">
              <button
                type="button"
                onClick={() => setAuthModal('login')}
                className="home-page__login-button"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setAuthModal('register')}
                className="home-page__signup-button"
              >
                Sign Up
              </button>
            </div>
          )}

          {currentUser?.role !== 'admin' && (
            <button
              type="button"
              onClick={openBooking}
              className="home-page__book-session-button"
            >
              <Calendar className="home-page__small-icon" />
              <span>Book Session</span>
            </button>
          )}

          {currentUser && (
            <div
              className="desktop-profile"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsProfileMenuOpen(false)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsProfileMenuOpen(false)
              }}
            >
              <button
                type="button"
                className="desktop-profile-trigger"
                aria-label={`Open ${currentUser.name}'s profile menu`}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </button>
              {isProfileMenuOpen && (
                <div className="desktop-profile-menu">
                  <div className="desktop-profile-details">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.role} account</span>
                  </div>
                  {currentUser.role === 'admin' && (
                    <button type="button" onClick={() => { setIsAdminModalOpen(true); setIsProfileMenuOpen(false) }}>
                      <LayoutDashboard size={15} /> Admin Panel
                    </button>
                  )}
                  {currentUser.role === 'customer' && (
                    <button type="button" onClick={() => { openConversations(); setIsProfileMenuOpen(false) }}>
                      <MessageCircle size={15} /> Chat with admin
                    </button>
                  )}
                  <button type="button" className="home-page__logout-button" onClick={() => { handleLogout(); setIsProfileMenuOpen(false) }}>
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            setIsProfileMenuOpen(false)
            if (!isMobileMenuOpen) setIsMobileMenuMounted(true)
            setIsMobileMenuOpen((isOpen) => !isOpen)
          }}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {isMobileMenuOpen && (
          <div className="mobile-nav-bar-blur" aria-hidden="true" />
        )}

        {isMobileMenuMounted && (
          <div
            id="mobile-navigation"
            className={`mobile-nav-menu${isMobileMenuOpen ? '' : ' is-closing'}`}
            aria-hidden={!isMobileMenuOpen}
            inert={!isMobileMenuOpen}
          >
            <div className="mobile-nav-header">
              <div className="mobile-nav-brand">
                <img src={artistImage} alt="" />
                <span>
                  <strong>AirWizard Tattoo</strong>
                  <small>Guiguinto, Bulacan</small>
                </span>
              </div>
              <div className="mobile-nav-header-actions">
                {currentUser && (
                  <button
                    type="button"
                    className="mobile-nav-profile-trigger"
                    aria-label={`Open ${currentUser.name}'s profile menu`}
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </button>
                )}
                <button
                  type="button"
                  className="mobile-nav-close"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X size={19} />
                </button>
              </div>
            </div>
            {currentUser && isProfileMenuOpen && (
              <div className="mobile-nav-account">
                <div className="mobile-nav-user">
                  <span className="mobile-nav-user-avatar">{currentUser.name.charAt(0).toUpperCase()}</span>
                  <span className="mobile-nav-user-details">
                    <strong>{currentUser.name}</strong>
                    <small>{currentUser.role} account</small>
                  </span>
                </div>
                <div className="mobile-nav-account-actions">
                  {currentUser.role === 'admin' && (
                    <button type="button" onClick={() => { setIsAdminModalOpen(true); setIsMobileMenuOpen(false); setIsProfileMenuOpen(false) }}>
                      <LayoutDashboard size={15} /> Admin Panel
                    </button>
                  )}
                  <button type="button" className="home-page__logout-button" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); setIsProfileMenuOpen(false) }}>
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              </div>
            )}
            <a href="#home" className={activeNavId === 'home' ? 'is-active' : ''} onClick={() => { setActiveNavId('home'); setIsMobileMenuOpen(false) }}>Home</a>
            <a href="#portfolio" className={activeNavId === 'portfolio' ? 'is-active' : ''} onClick={() => { setActiveNavId('portfolio'); setIsMobileMenuOpen(false) }}>Portfolio</a>
            <a href="#estimator" className={activeNavId === 'estimator' ? 'is-active' : ''} onClick={() => { setActiveNavId('estimator'); setIsMobileMenuOpen(false) }}>Estimator</a>
            <a href="#flash" className={activeNavId === 'flash' ? 'is-active' : ''} onClick={() => { setActiveNavId('flash'); setIsMobileMenuOpen(false) }}>1/1 Flash</a>
            <a href="#location" className={activeNavId === 'location' ? 'is-active' : ''} onClick={() => { setActiveNavId('location'); setIsMobileMenuOpen(false) }}>Location</a>
            <a href="#contact" className={activeNavId === 'contact' ? 'is-active' : ''} onClick={() => { setActiveNavId('contact'); setIsMobileMenuOpen(false) }}>Contact</a>
            {!currentUser && (
              <div className="mobile-nav-auth">
                <button type="button" onClick={() => { setAuthModal('login'); setIsMobileMenuOpen(false) }}>Log In</button>
                <button type="button" onClick={() => { setAuthModal('register'); setIsMobileMenuOpen(false) }}>Sign Up</button>
              </div>
            )}
            {currentUser?.role !== 'admin' && (
              <button type="button" className="mobile-nav-book" onClick={() => { openBooking(); setIsMobileMenuOpen(false) }}>
                <Calendar size={16} /> Book Session
              </button>
            )}
            {currentUser?.role !== 'admin' && (
              <button type="button" className="mobile-nav-chat" onClick={() => {
                if (currentUser?.role === 'customer') openConversations()
                else setAuthModal('login')
                setIsMobileMenuOpen(false)
                setIsProfileMenuOpen(false)
              }}>
                <MessageCircle size={16} /> Chat with admin
              </button>
            )}
          </div>
        )}
      </nav>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* HERO SECTION */}
      <header className="home-page__hero-section">
        <div className="home-page__hero-background" />
        <div className="home-page__hero-container">
          
          <div className="home-page__hero-copy">
            <div className="home-page__hero-badge">
              <span>Tattoo Artist • Guiguinto, Bulacan</span>
            </div>
            
            <h1 className="home-page__hero-title">
              Precision <span className="home-page__hero-title-accent">Fine Line</span> & Cyberwork.
            </h1>
            
            <p className="home-page__hero-description">
              Custom skin art crafted with immaculate detail. Private studio experience dedicated to unique blackwork, Japanese integration, and minimalist elegance.
            </p>

            <div className="home-page__hero-actions">
              <button 
                onClick={openBooking}
                className="home-page__primary-button"
              >
                <Calendar className="home-page__small-icon" />
                <span>Book a Consultation</span>
              </button>
              
              <a 
                href="#portfolio"
                className="home-page__secondary-button"
              >
                <span>View Portfolio</span>
                <ChevronRight className="home-page__button-icon" />
              </a>
            </div>

            <div className="home-page__hero-stats">
              <div>
                <p className="home-page__stat-value">25+</p>
                <p className="home-page__muted-text">Years Experience</p>
              </div>
              <div>
                <p className="home-page__stat-value">1.2K+</p>
                <p className="home-page__muted-text">Custom Pieces</p>
              </div>
              <div>
                <p className="home-page__stat-value">99.99%</p>
                <p className="home-page__muted-text">Sterile & Safe</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* CONTINUOUS SMOOTH MARQUEE CAROUSEL */}
      <section id="portfolio" className="home-page__portfolio-section scroll-reveal">
        <div className="portfolio-heading">
          <div>
            <span className="home-page__eyebrow">Recent Works</span>
            <h2 className="home-page__section-title">Portfolio Showcase</h2>
          </div>
          <p className="portfolio-description">Explore the artist's tattoo work and open any piece for a closer look.</p>
        </div>

        {/* Marquee Track */}
        <div className="home-page__carousel-window portfolio-carousel-window">
          <div className="home-page__carousel-fade-left" />
          <div className="home-page__carousel-fade-right" />

          <div className="home-page__carousel-track portfolio-carousel-track marquee-track">
            {[...PORTFOLIO_ITEMS, ...PORTFOLIO_ITEMS].map((item, index) => (
              <div 
                key={`${item.id}-${index}`}
                onClick={() => setSelectedImage(item)}
                className="home-page__portfolio-card"
              >
                <div className="home-page__portfolio-image-wrap">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="home-page__portfolio-image"
                  />
                  <span className="home-page__portfolio-category">
                    {item.category}
                  </span>
                </div>
                <div className="home-page__portfolio-card-content">
                  <h4 className="home-page__portfolio-title">{item.title}</h4>
                  <p className="home-page__portfolio-description">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICE ESTIMATOR SECTION */}
      <section id="estimator" className="home-page__estimator-section scroll-reveal">
        <div className="home-page__section-heading">
          <span className="home-page__eyebrow">Transparent Pricing</span>
          <h2 className="home-page__section-title">Session Rate Estimator</h2>
          <p className="home-page__section-subtitle">Calculate an instant quote for your next tattoo project with AirWizard.</p>
        </div>

        <div className="home-page__estimator-card">
          <div className="home-page__estimator-options">
            
            {/* Style Selection */}
            <div>
              <label className="home-page__option-label">1. Select Tattoo Style</label>
              <div className="home-page__style-options">
                {ESTIMATOR_STYLES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setEstStyle(s.price)}
                    className={estStyle === s.price ? 'estimator-choice is-active' : 'estimator-choice'}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <label className="home-page__option-label">2. Choose Approximate Size</label>
              <div className="home-page__size-options">
                {ESTIMATOR_SIZES.map((sz) => (
                  <button
                    key={sz.name}
                    onClick={() => setEstSize(sz.price)}
                    className={estSize === sz.price ? 'estimator-choice is-active' : 'estimator-choice'}
                  >
                    {sz.name}
                  </button>
                ))}
              </div>
            </div>

                      {/* Placement Selection */}
            <div>
              <label className="home-page__option-label">3. Select Placement</label>
              <div className="home-page__placement-options">
                {ESTIMATOR_PLACEMENTS.map((placement) => (
                  <button
                    key={placement.name}
                    type="button"
                    onClick={() => setEstPlacement(placement.price)}
                    className={estPlacement === placement.price ? 'estimator-choice is-active' : 'estimator-choice'}
                  >
                    {placement.name}
                  </button>
                ))}
              </div>
            </div>
</div>

          <div className="home-page__estimate-summary">
            <span className="home-page__estimate-label">Estimated Investment</span>
            <div className="home-page__estimate-price">
              {estimateCurrency}
            </div>
            <p className="home-page__muted-text">Includes consultation, sterile single-use supplies, and aftercare kit.</p>
            <button 
              onClick={() => openBookingWithEstimate(selectedEstimate)}
              className="home-page__estimate-button"
            >
              Lock in Estimate & Book
            </button>
          </div>
        </div>
      </section>

      {/* 1/1 CLAIMABLE FLASH DESIGNS */}
      <section id="flash" className="home-page__flash-section scroll-reveal">
        <div className="home-page__flash-header">
          <div className="home-page__section-heading">
            <span className="home-page__eyebrow">Available Flash</span>
            <h2 className="home-page__section-title">1/1 Claimable Designs</h2>
            <p className="home-page__section-subtitle">Original hand-drawn flash pieces tattooed only once. Claim yours before it's gone.</p>
          </div>
        </div>

        <div className="home-page__flash-carousel-shell" role="group" aria-label="Flash design carousel">
          <button className="home-page__flash-arrow" type="button" aria-label="Previous flash designs" onClick={() => scrollFlashCarousel(-1)} disabled={!canScrollFlashLeft}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="home-page__flash-grid" ref={flashCarouselRef} role="region" aria-label="1/1 flash designs" tabIndex={0}>
          {!flashLoaded ? (
            <p className="home-page__flash-empty">Loading flash designs...</p>
          ) : flashItems.length === 0 ? (
            <p className="home-page__flash-empty">No flash designs are available right now. Check back soon.</p>
          ) : flashItems.map((flash) => (
            <div key={flash.id} className="home-page__flash-card">
              <div>
                <div className="home-page__flash-image-wrap">
                  <button
                    type="button"
                    className="home-page__flash-image-button"
                    aria-label={`View ${flash.title} image`}
                    aria-haspopup="dialog"
                    onClick={() => setSelectedImage(flash)}
                  >
                    <img src={flash.img} alt="" className="home-page__flash-image" />
                  </button>
                  <div className="home-page__flash-status">
                    {flash.available ? (
                      <span className="home-page__available-badge">Available</span>
                    ) : (
                      <span className="home-page__claimed-badge">Claimed</span>
                    )}
                  </div>
                </div>
                <div className="home-page__flash-details">
                  <h4 className="home-page__flash-title">{flash.title}</h4>
                  <p className="home-page__flash-size">Size: {flash.size}</p>
                </div>
              </div>
              <div className="home-page__flash-card-footer">
                <span className="home-page__flash-price">{flash.price}</span>
                <button 
                  disabled={!flashLoaded || !flash.available}
                  onClick={() => onClaimFlash(flash)}
                  className={flash.available ? 'flash-claim-button' : 'flash-claim-button is-unavailable'}
                >
                  {!flashLoaded ? 'Loading...' : flash.available ? 'Claim Flash' : 'Taken'}
                </button>
              </div>
            </div>
          ))}
          </div>
          <button className="home-page__flash-arrow" type="button" aria-label="Next flash designs" onClick={() => scrollFlashCarousel(1)} disabled={!canScrollFlashRight}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* LOCATION */}
      <section id="location" className="location-section scroll-reveal">
        <div className="location-content">
          <div className="location-map-card">
            <iframe
              className="location-map"
              title="Google Maps: JayTATTOO, Malis, Guiguinto, Bulacan"
              src="https://maps.google.com/maps?q=JayTATTOO%2C%20Malis%2C%20Guiguinto%2C%20Bulacan%2C%20Philippines&z=16&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="location-details">
            <span className="location-eyebrow">Find the studio</span>
            <h2>JayTATTOO</h2>
            <p className="location-address">Malis, Guiguinto, Bulacan</p>
            <p className="location-description">
              Find JayTATTOO in Malis, Guiguinto, Bulacan. Use the map below to open the location in Google Maps.
            </p>
            <div className="location-appointment-note">
              <Clock size={17} aria-hidden="true" />
              <span>By appointment only</span>
            </div>
            <a
              className="location-directions"
              href="https://www.google.com/maps/search/?api=1&query=JayTATTOO%2C%20Malis%2C%20Guiguinto%2C%20Bulacan%2C%20Philippines"
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={17} aria-hidden="true" />
              <span>Open in Google Maps</span>
              <ChevronRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="home-page__footer scroll-reveal">
        <div className="home-page__footer-container">
          <div className="home-page__footer-brand">
            <div className="home-page__footer-logo">
              <img src={artistImage} alt="AirWizard Tattoo logo" className="home-page__brand-image" />
            </div>
            <span className="home-page__footer-brand-name">AirWizard Tattoo</span>
          </div>
          <div className="home-page__footer-social-links">
            <a href="https://www.instagram.com/yajsilver?stkn=ZDNlZDc0MzIxNw==" target="_blank" rel="noreferrer" className="home-page__footer-social-link">
              <img src={instagramLogo} alt="" aria-hidden="true" className="home-page__social-icon" />
              <span>Instagram</span>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61570740783075" target="_blank" rel="noreferrer" className="home-page__footer-social-link">
              <img src={facebookLogo} alt="" aria-hidden="true" className="home-page__social-icon" />
              <span>Facebook</span>
            </a>
            <a href="https://www.tiktok.com/@jay_tattoo69?is_from_webapp=1&amp;sender_device=pc" target="_blank" rel="noreferrer" className="home-page__footer-social-link">
              <img src={tiktokLogo} alt="" aria-hidden="true" className="home-page__social-icon" />
              <span>TikTok</span>
            </a>
            <a href="tel:+639068216233" className="home-page__footer-social-link">
              <Phone size={16} aria-hidden="true" />
              <span>0906 821 6233</span>
            </a>
          </div>
          <p className="home-page__copyright">© 2026 AirWizard Tattoo. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
