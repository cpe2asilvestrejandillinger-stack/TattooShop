import './BookingModal.css'
import { Camera, Check, X } from 'lucide-react'

export default function BookingModal(props) {
  const { isBookingOpen, setIsBookingOpen, closeBookingModal = () => setIsBookingOpen(false), bookingSuccess, bookName, setBookName, bookPhone, setBookPhone, bookStyle, setBookStyle, bookSize, setBookSize, bookDate, setBookDate, bookTime, setBookTime, handleReferenceImageChange, bookNotes, setBookNotes, bookingError, bookingSubmitting, handleBookingSubmit, currentUser } = props
  return (
    <>
      {/* BOOKING SESSION MODAL */}
      {isBookingOpen && (
        <div className="booking-modal__modal-backdrop">
          <div className="booking-modal__modal">
            <button 
              onClick={closeBookingModal} 
              className="booking-modal__close-button"
            >
              <X className="booking-modal__close-icon" />
            </button>

            {bookingSuccess ? (
              <div className="booking-modal__success-state">
                <div className="booking-modal__success-icon-wrapper">
                  <Check className="booking-modal__success-icon" />
                </div>
                <h3 className="booking-modal__success-title">Booking Request Received!</h3>
                <p className="booking-modal__success-message">AirWizard will review your request and contact you via email or phone for deposit instructions.</p>
              </div>
            ) : (
              <>
                <div className="booking-modal__form-heading">
                  <span className="booking-modal__eyebrow">Consultation Request</span>
                  <h3 className="booking-modal__title">Book Your Session</h3>
                </div>

                <form onSubmit={handleBookingSubmit} className="booking-modal__form">
                  <div className="booking-modal__field-row">
                    <div>
                      <label className="booking-modal__field-label">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={bookName}
                        onChange={(e) => setBookName(e.target.value)}
                        placeholder="Full name" 
                        className="booking-modal__text-input"
                      />
                    </div>
                    <div>
                      <label className="booking-modal__field-label">Phone Number</label>
                      <input 
                        type="text" 
                        required
                        value={bookPhone}
                        onChange={(e) => setBookPhone(e.target.value)}
                        placeholder="+63 917..." 
                        className="booking-modal__text-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="booking-modal__field-label">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={currentUser?.email || ''}
                      readOnly
                      placeholder="name@example.com" 
                      className="booking-modal__text-input"
                    />
                  </div>

                  <div className="booking-modal__field-row">
                    <div>
                      <label className="booking-modal__field-label">Preferred Style</label>
                      <select 
                        value={bookStyle}
                        onChange={(e) => setBookStyle(e.target.value)}
                        className="booking-modal__select-input"
                      >
                        {bookStyle.startsWith('Flash:') && <option value={bookStyle}>{bookStyle}</option>}
                        <option value="Fine Line">Fine Line</option>
                        <option value="Cyberwork">Cyberwork</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Ornamental">Ornamental</option>
                        <option value="Blackwork">Blackwork</option>
                      </select>
                    </div>
                    <div>
                      <label className="booking-modal__field-label">{bookStyle.startsWith('Flash:') ? 'Flash Size' : 'Estimated Size'}</label>
                      <select 
                        value={bookSize}
                        onChange={(e) => setBookSize(e.target.value)}
                        className="booking-modal__select-input"
                      >
                        {!['Small (5-10cm)', 'Medium (10-15cm)', 'Large (Sleeve/Thigh)'].includes(bookSize) && <option value={bookSize}>{bookSize}</option>}
                        <option value="Small (5-10cm)">Small (5-10cm)</option>
                        <option value="Medium (10-15cm)">Medium (10-15cm)</option>
                        <option value="Large (Sleeve/Thigh)">Large (Sleeve / Thigh)</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-modal__field-row">
                    <div>
                      <label className="booking-modal__field-label">Target Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookDate}
                        onChange={(event) => setBookDate(event.target.value)}
                        className="booking-modal__text-input"
                      />
                    </div>
                    <div>
                      <label className="booking-modal__field-label">Target Time</label>
                      <input
                        type="time"
                        required
                        value={bookTime}
                        onChange={(event) => setBookTime(event.target.value)}
                        className="booking-modal__text-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="booking-modal__field-label">Reference Image (Optional)</label>
                    <div className="booking-modal__upload-field">
                      <Camera className="booking-modal__upload-icon" />
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleReferenceImageChange}
                        className="booking-modal__file-input"
                      />
                    </div>
                    <p className="booking-reference-hint">JPG, PNG, or WebP. Maximum 10 MB.</p>
                  </div>

                  <div>
                    <label className="booking-modal__field-label">Design Concept Notes</label>
                    <textarea 
                      rows={3}
                      value={bookNotes}
                      onChange={(e) => setBookNotes(e.target.value)}
                      placeholder="Describe your tattoo idea, elements, and mood..." 
                      className="booking-modal__notes-input"
                    />
                  </div>

                                    {bookingError && <p className="booking-modal__error-message" role="alert">{bookingError}</p>}
                    <button 
                    disabled={bookingSubmitting}
                    type="submit"
                    className="booking-modal__submit-button"
                  >
                    {bookingSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </>
  )
}
