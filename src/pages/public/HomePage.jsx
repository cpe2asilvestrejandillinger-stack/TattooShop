import './HomePage.css'
import { useEffect, useRef, useState } from 'react'
import artistImage from '../../assets/artist.jpg'
import { Sparkles, Clock, MapPin, Calendar, ChevronRight, LogOut, LayoutDashboard, Menu, X, Music2, Phone } from 'lucide-react'
import { FLASH_ITEMS, PORTFOLIO_ITEMS } from '../../data/siteData'

export default function HomePage({ currentUser, openBooking, handleLogout, setAuthModal, setIsAdminModalOpen, setSelectedImage, estStyle, setEstStyle, estSize, setEstSize, estPlacement, setEstPlacement, setBookStyle, setIsBookingOpen }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pageRef = useRef(null)

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
    <div id="home" ref={pageRef} className="home-page__e77318ba home-page__root">
      
      {/* STICKY NAVIGATION BAR */}
      <nav className="home-page__6afe1a81">
        <div className="home-page__543ddcd2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="home-page__8e0dda3b">
            <img src={artistImage} alt="AirWizard Tattoo logo" className="home-page__brand-image" />
          </div>
          <div>
            <span className="home-page__e487dd00">AirWizard Tattoo</span>
            <span className="home-page__a2534b60">Guiguinto, Bulacan</span>
          </div>
        </div>

        <div className="home-page__c95ed303">
          <a href="#home" className="home-page__36e6f4bf">Home</a>
          <a href="#portfolio" className="home-page__36e6f4bf">Portfolio</a>
          <a href="#estimator" className="home-page__36e6f4bf">Estimator</a>
          <a href="#flash" className="home-page__36e6f4bf">1/1 Flash</a>
          <a href="#location" className="home-page__36e6f4bf">Location</a>
          <a href="#contact" className="home-page__36e6f4bf">Contact</a>
        </div>

        <div className="home-page__6b66ca0f">
          {currentUser ? (
            <div className="home-page__04007126">
              <div className="home-page__2a5c56b3">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="home-page__93d3b6a7">
                <p className="home-page__1ea0e6a1">{currentUser.name}</p>
                <p className="home-page__b4bf9de6">{currentUser.role} Account</p>
              </div>

              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => setIsAdminModalOpen(true)}
                  className="home-page__a3960869"
                >
                  <LayoutDashboard className="home-page__b41c1b51" />
                  <span>Admin Panel</span>
                </button>
              )}

              <button 
                onClick={handleLogout}
                className="home-page__5ce77922"
                title="Log Out"
              >
                <LogOut className="home-page__0bfbea32" />
              </button>
            </div>
          ) : (
            <div className="home-page__37a944a4">
              <button
                type="button"
                onClick={() => setAuthModal('login')}
                className="home-page__d207ebbc"
              >
                Log In
              </button>
            </div>
          )}

          <button 
            onClick={openBooking}
            className="home-page__a17f1ca4"
          >
            <Calendar className="home-page__0bfbea32" />
            <span>Book Session</span>
          </button>
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {isMobileMenuOpen && (
          <div id="mobile-navigation" className="mobile-nav-menu">
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
            <a href="#portfolio" onClick={() => setIsMobileMenuOpen(false)}>Portfolio</a>
            <a href="#estimator" onClick={() => setIsMobileMenuOpen(false)}>Estimator</a>
            <a href="#flash" onClick={() => setIsMobileMenuOpen(false)}>1/1 Flash</a>
            <a href="#location" onClick={() => setIsMobileMenuOpen(false)}>Location</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
            {!currentUser && (
              <div className="mobile-nav-auth">
                <button type="button" onClick={() => { setAuthModal('login'); setIsMobileMenuOpen(false) }}>Log In</button>
              </div>
            )}
            <button type="button" className="mobile-nav-book" onClick={() => { openBooking(); setIsMobileMenuOpen(false) }}>
              <Calendar size={16} /> Book Session
            </button>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <header className="home-page__92a92b8e">
        <div className="home-page__2a613f04" />
        <div className="home-page__925957c0">
          
          <div className="home-page__d4e5279e">
            <div className="home-page__8119ccd0">
              <Sparkles className="home-page__b41c1b51" />
              <span>Solo Artist Studio • Meycauayan, Bulacan</span>
            </div>
            
            <h1 className="home-page__67cf6876">
              Precision <span className="home-page__053aeb71">Fine Line</span> & Cyberwork.
            </h1>
            
            <p className="home-page__798fc550">
              Custom skin art crafted with immaculate detail. Private studio experience dedicated to unique blackwork, Japanese integration, and minimalist elegance.
            </p>

            <div className="home-page__11a1a8d8">
              <button 
                onClick={openBooking}
                className="home-page__92aec5de"
              >
                <Calendar className="home-page__0bfbea32" />
                <span>Book a Consultation</span>
              </button>
              
              <a 
                href="#portfolio"
                className="home-page__70b816f6"
              >
                <span>View Portfolio</span>
                <ChevronRight className="home-page__321ae1ab" />
              </a>
            </div>

            <div className="home-page__ca178636">
              <div>
                <p className="home-page__7a44606b">8+</p>
                <p className="home-page__3dc37db2">Years Experience</p>
              </div>
              <div>
                <p className="home-page__7a44606b">1.2K+</p>
                <p className="home-page__3dc37db2">Custom Pieces</p>
              </div>
              <div>
                <p className="home-page__7a44606b">100%</p>
                <p className="home-page__3dc37db2">Sterile & Safe</p>
              </div>
            </div>
          </div>

          <div className="home-page__82a7fab5">
            <div className="home-page__3f56b3a0">
              <img 
                src={artistImage} 
                alt="AirWizard Tattoo and Airbrush logo" 
                className="home-page__c74fa0ce"
              />
              <div className="home-page__029e2f67" />
              <div className="home-page__b22a685d">
                <span className="home-page__653aaa90">Artist Logo</span>
                <h3 className="home-page__89fb7efb">AirWizard Tattoo & Airbrush</h3>
                <p className="home-page__e76a10a9">Custom tattoo, ink, and airbrush painting.</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* CONTINUOUS SMOOTH MARQUEE CAROUSEL */}
      <section id="portfolio" className="home-page__e75cdeee scroll-reveal">
        <div className="portfolio-heading">
          <div>
            <span className="home-page__90cbbb9d">Recent Works</span>
            <h2 className="home-page__2af17e58">Portfolio Showcase</h2>
          </div>
          <p className="portfolio-description">Explore the artist's tattoo work and open any piece for a closer look.</p>
        </div>

        {/* Marquee Track */}
        <div className="home-page__cb0c750a portfolio-carousel-window">
          <div className="home-page__bb5e565b" />
          <div className="home-page__eaa8838b" />

          <div className="home-page__eb1c5816 portfolio-carousel-track marquee-track">
            {[...PORTFOLIO_ITEMS, ...PORTFOLIO_ITEMS].map((item, index) => (
              <div 
                key={`${item.id}-${index}`}
                onClick={() => setSelectedImage(item)}
                className="home-page__5e27d5aa"
              >
                <div className="home-page__d12cb582">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="home-page__c394051e"
                  />
                  <span className="home-page__37931d44">
                    {item.category}
                  </span>
                </div>
                <div className="home-page__c07e54fd">
                  <h4 className="home-page__d0eda883">{item.title}</h4>
                  <p className="home-page__a777eab2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICE ESTIMATOR SECTION */}
      <section id="estimator" className="home-page__893ff5b7 scroll-reveal">
        <div className="home-page__bc3f4cfa">
          <span className="home-page__90cbbb9d">Transparent Pricing</span>
          <h2 className="home-page__2af17e58">Session Rate Estimator</h2>
          <p className="home-page__945697ac">Calculate an instant quote for your next tattoo project with AirWizard.</p>
        </div>

        <div className="home-page__8a01c4a3">
          <div className="home-page__8a63dfbd">
            
            {/* Style Selection */}
            <div>
              <label className="home-page__be354676">1. Select Tattoo Style</label>
              <div className="home-page__94f11a0c">
                {[
                  { name: 'Fine Line', price: 3000 },
                  { name: 'Cyberwork', price: 4500 },
                  { name: 'Japanese', price: 5000 },
                  { name: 'Ornamental', price: 3500 },
                  { name: 'Blackwork', price: 4000 }
                ].map((s) => (
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
              <label className="home-page__be354676">2. Choose Approximate Size</label>
              <div className="home-page__7665800e">
                {[
                  { name: 'Small (5-10cm)', price: 2000 },
                  { name: 'Medium (10-15cm)', price: 4500 },
                  { name: 'Large (Sleeve/Thigh)', price: 8500 }
                ].map((sz) => (
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
              <label className="home-page__be354676">3. Select Placement</label>
              <div className="home-page__9717e995">
                {[
                  { name: 'Arm / Leg', price: 500 },
                  { name: 'Torso', price: 1000 },
                  { name: 'Ribs / Neck', price: 1500 },
                ].map((placement) => (
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

          <div className="home-page__23303a7e">
            <span className="home-page__5115736b">Estimated Investment</span>
            <div className="home-page__f966056d">
              ₱{(estStyle + estSize + estPlacement).toLocaleString()}
            </div>
            <p className="home-page__3dc37db2">Includes consultation, sterile single-use supplies, and aftercare kit.</p>
            <button 
              onClick={openBooking}
              className="home-page__3dc0d97c"
            >
              Lock in Estimate & Book
            </button>
          </div>
        </div>
      </section>

      {/* 1/1 CLAIMABLE FLASH DESIGNS */}
      <section id="flash" className="home-page__6f388d19 scroll-reveal">
        <div className="home-page__bc3f4cfa">
          <span className="home-page__90cbbb9d">Available Flash</span>
          <h2 className="home-page__2af17e58">1/1 Claimable Designs</h2>
          <p className="home-page__945697ac">Original hand-drawn flash pieces tattooed only once. Claim yours before it's gone.</p>
        </div>

        <div className="home-page__d1e1fbcf">
          {FLASH_ITEMS.map((flash) => (
            <div key={flash.id} className="home-page__d22d90eb">
              <div>
                <div className="home-page__af4eee13">
                  <img src={flash.img} alt={flash.title} className="home-page__0e16068f" />
                  <div className="home-page__2c73063d">
                    {flash.available ? (
                      <span className="home-page__f683084e">Available</span>
                    ) : (
                      <span className="home-page__f5220d58">Claimed</span>
                    )}
                  </div>
                </div>
                <div className="home-page__8e63407b">
                  <h4 className="home-page__0d6ca94a">{flash.title}</h4>
                  <p className="home-page__5aa543ea">Size: {flash.size}</p>
                </div>
              </div>
              <div className="home-page__f608d25e">
                <span className="home-page__a30c4755">{flash.price}</span>
                <button 
                  disabled={!flash.available}
                  onClick={() => {
                    setBookStyle(`Flash: ${flash.title}`);
                    setIsBookingOpen(true);
                  }}
                  className={flash.available ? 'flash-claim-button' : 'flash-claim-button is-unavailable'}
                >
                  {flash.available ? 'Claim Flash' : 'Taken'}
                </button>
              </div>
            </div>
          ))}
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
            <div className="location-map-label">
              <MapPin size={17} aria-hidden="true" />
              <span>JayTATTOO - Malis</span>
            </div>
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
      <footer id="contact" className="home-page__46baae01 scroll-reveal">
        <div className="home-page__c4c17ea5">
          <div className="home-page__b9fc95fb">
            <div className="home-page__264a8410">
              <img src={artistImage} alt="AirWizard Tattoo logo" className="home-page__brand-image" />
            </div>
            <span className="home-page__c407b7ca">AirWizard Tattoo</span>
          </div>
          <div className="home-page__7b83d826">
            <a href="https://www.instagram.com/yajsilver?stkn=ZDNlZDc0MzIxNw==" target="_blank" rel="noreferrer" className="home-page__81b09137">
              <span aria-hidden="true" className="home-page__69450ef1">◎</span>
              <span>Instagram</span>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61570740783075" target="_blank" rel="noreferrer" className="home-page__81b09137">
              <span aria-hidden="true" className="home-page__69450ef1">f</span>
              <span>Facebook</span>
            </a>
            <a href="https://www.tiktok.com/@jay_tattoo69?is_from_webapp=1&amp;sender_device=pc" target="_blank" rel="noreferrer" className="home-page__81b09137">
              <Music2 size={16} aria-hidden="true" />
              <span>TikTok</span>
            </a>
            <a href="tel:+639068216233" className="home-page__81b09137">
              <Phone size={16} aria-hidden="true" />
              <span>0906 821 6233</span>
            </a>
          </div>
          <p className="home-page__12d31289">© 2026 AirWizard Tattoo. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
