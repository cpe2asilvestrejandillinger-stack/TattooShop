import './BookingModal.css'
import { Camera, Check, X } from 'lucide-react'

export default function BookingModal(props) {
  const { isBookingOpen, setIsBookingOpen, bookingSuccess, bookName, setBookName, bookPhone, setBookPhone, bookStyle, setBookStyle, bookSize, setBookSize, bookDate, setBookDate, bookTime, setBookTime, setBookImageFile, bookNotes, setBookNotes, bookingError, bookingSubmitting, handleBookingSubmit, currentUser } = props
  return (
    <>
      {/* BOOKING SESSION MODAL */}
      {isBookingOpen && (
        <div className="booking-modal__d30ad84c">
          <div className="booking-modal__9c099de2">
            <button 
              onClick={() => setIsBookingOpen(false)} 
              className="booking-modal__404bb319"
            >
              <X className="booking-modal__a8600f1b" />
            </button>

            {bookingSuccess ? (
              <div className="booking-modal__e74d0162">
                <div className="booking-modal__9c124d16">
                  <Check className="booking-modal__b034b4d3" />
                </div>
                <h3 className="booking-modal__dcf2c1b7">Booking Request Received!</h3>
                <p className="booking-modal__da468e8c">AirWizard will review your request and contact you via email or phone for deposit instructions.</p>
              </div>
            ) : (
              <>
                <div className="booking-modal__b6777c6d">
                  <span className="booking-modal__90cbbb9d">Consultation Request</span>
                  <h3 className="booking-modal__a8f3173f">Book Your Session</h3>
                </div>

                <form onSubmit={handleBookingSubmit} className="booking-modal__3e7ce58d">
                  <div className="booking-modal__4c017de7">
                    <div>
                      <label className="booking-modal__9943293d">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={bookName}
                        onChange={(e) => setBookName(e.target.value)}
                        placeholder="Full name" 
                        className="booking-modal__d0ef7e06"
                      />
                    </div>
                    <div>
                      <label className="booking-modal__9943293d">Phone Number</label>
                      <input 
                        type="text" 
                        required
                        value={bookPhone}
                        onChange={(e) => setBookPhone(e.target.value)}
                        placeholder="+63 917..." 
                        className="booking-modal__d0ef7e06"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="booking-modal__9943293d">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={currentUser?.email || ''}
                      readOnly
                      placeholder="name@example.com" 
                      className="booking-modal__d0ef7e06"
                    />
                  </div>

                  <div className="booking-modal__4c017de7">
                    <div>
                      <label className="booking-modal__9943293d">Preferred Style</label>
                      <select 
                        value={bookStyle}
                        onChange={(e) => setBookStyle(e.target.value)}
                        className="booking-modal__3353e4a1"
                      >
                        <option value="Fine Line">Fine Line</option>
                        <option value="Cyberwork">Cyberwork</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Ornamental">Ornamental</option>
                        <option value="Blackwork">Blackwork</option>
                      </select>
                    </div>
                    <div>
                      <label className="booking-modal__9943293d">Estimated Size</label>
                      <select 
                        value={bookSize}
                        onChange={(e) => setBookSize(e.target.value)}
                        className="booking-modal__3353e4a1"
                      >
                        <option value="Small (5-10cm)">Small (5-10cm)</option>
                        <option value="Medium (10-15cm)">Medium (10-15cm)</option>
                        <option value="Large (Sleeve/Thigh)">Large (Sleeve / Thigh)</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-modal__4c017de7">
                    <div>
                      <label className="booking-modal__9943293d">Target Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookDate}
                        onChange={(event) => setBookDate(event.target.value)}
                        className="booking-modal__d0ef7e06"
                      />
                    </div>
                    <div>
                      <label className="booking-modal__9943293d">Target Time</label>
                      <input
                        type="time"
                        required
                        value={bookTime}
                        onChange={(event) => setBookTime(event.target.value)}
                        className="booking-modal__d0ef7e06"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="booking-modal__9943293d">Reference Image (Optional)</label>
                    <div className="booking-modal__0f242944">
                      <Camera className="booking-modal__6e05cba6" />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(event) => setBookImageFile(event.target.files?.[0] || null)}
                        className="booking-modal__69d8cc99"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="booking-modal__9943293d">Design Concept Notes</label>
                    <textarea 
                      rows={3}
                      value={bookNotes}
                      onChange={(e) => setBookNotes(e.target.value)}
                      placeholder="Describe your tattoo idea, elements, and mood..." 
                      className="booking-modal__10aed389"
                    />
                  </div>

                                    {bookingError && <p className="booking-modal__cac5c5bc" role="alert">{bookingError}</p>}
                    <button 
                    disabled={bookingSubmitting}
                    type="submit"
                    className="booking-modal__41a81366"
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
