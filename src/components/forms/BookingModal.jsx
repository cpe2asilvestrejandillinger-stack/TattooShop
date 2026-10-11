import './BookingModal.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react'

const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function BookingModal(props) {
  const { isBookingOpen, setIsBookingOpen, bookingLocationStep, setBookingLocationStep, closeBookingModal = () => setIsBookingOpen(false), bookingSuccess, bookName, setBookName, bookPhone, setBookPhone, bookStyle, setBookStyle, bookSize, setBookSize, bookPlacement, setBookPlacement, bookLocation, setBookLocation, bookAddress, setBookAddress, bookDate, setBookDate, bookTime, setBookTime, unavailableDates = [], availabilityLoading = false, availabilityError = '', handleReferenceImageChange, bookNotes, setBookNotes, bookingError, bookingSubmitting, handleBookingSubmit, currentUser } = props
  const [calendarMonth, setCalendarMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1) })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [timeHour, setTimeHour] = useState('')
  const [timeMinute, setTimeMinute] = useState('00')
  const [timePeriod, setTimePeriod] = useState('AM')
  const calendarPickerRef = useRef(null)
  const todayKey = toDateKey(new Date())
  const monthLabel = calendarMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const offset = new Date(year, month, 1).getDay()
    const count = new Date(year, month + 1, 0).getDate()
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => toDateKey(new Date(year, month, index + 1)))]
  }, [calendarMonth])

  useEffect(() => {
    if (!bookDate) return
    const [year, month] = bookDate.split('-').map(Number)
    setCalendarMonth(new Date(year, month - 1, 1))
  }, [bookDate])

  useEffect(() => {
    if (!isBookingOpen) return
    if (!bookTime) {
      setTimeHour('')
      setTimeMinute('00')
      setTimePeriod('AM')
      return
    }
    const [hour24, minute] = bookTime.split(':').map(Number)
    setTimeHour(String(hour24 % 12 || 12))
    setTimeMinute(String(minute).padStart(2, '0'))
    setTimePeriod(hour24 >= 12 ? 'PM' : 'AM')
  }, [isBookingOpen])

  useEffect(() => {
    if (!isBookingOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !isCalendarOpen) closeBookingModal()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isBookingOpen, isCalendarOpen, closeBookingModal])

  useEffect(() => {
    if (!isCalendarOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!calendarPickerRef.current?.contains(event.target)) setIsCalendarOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsCalendarOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isCalendarOpen])

  const chooseDate = (date) => {
    if (date < todayKey || unavailableDates.includes(date)) return
    setBookDate(date)
    setIsCalendarOpen(false)
  }

  const selectedDateLabel = bookDate
    ? new Date(`${bookDate}T12:00:00`).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Choose a date'

  const updateBookingTime = (hourValue, minuteValue, periodValue) => {
    const hour = Number(hourValue)
    const minute = Number(minuteValue)
    if (!hourValue || !minuteValue || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      setBookTime('')
      return
    }
    const hour24 = (hour % 12) + (periodValue === 'PM' ? 12 : 0)
    setBookTime(`${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return (
    <>
      {/* BOOKING SESSION MODAL */}
      {isBookingOpen && (
        <div className="booking-modal__modal-backdrop">
          <div className="booking-modal__modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
            <button 
              type="button"
              onClick={closeBookingModal} 
              className="booking-modal__close-button"
              aria-label="Close booking dialog"
            >
              <X className="booking-modal__close-icon" />
            </button>

            {bookingSuccess ? (
              <div className="booking-modal__success-state">
                <div className="booking-modal__success-icon-wrapper">
                  <Check className="booking-modal__success-icon" />
                </div>
                <h3 id="booking-modal-title" className="booking-modal__success-title">Booking Request Received!</h3>
                <p className="booking-modal__success-message">Your date is held for 2 hours while AirWizard reviews your request. If it is not approved before then, the date will reopen.</p>
              </div>
            ) : bookingLocationStep ? (
              <section className="booking-location-step" aria-labelledby="booking-modal-title">
                <span className="booking-modal__eyebrow">Start your booking</span>
                <h3 id="booking-modal-title" className="booking-modal__title">Where would you like your session?</h3>
                <p className="booking-location-step__description">Choose a location to continue to the booking details.</p>
                <div className="booking-location-step__choices">
                  <button type="button" className="booking-location-step__choice" onClick={() => { setBookLocation('studio'); setBookAddress(''); setBookingLocationStep(false) }}>
                    <Building2 size={24} aria-hidden="true" />
                    <span><strong>At the studio</strong><small>Book your session at AirWizard</small></span>
                  </button>
                  <button type="button" className="booking-location-step__choice" onClick={() => { setBookLocation('home'); setBookAddress(''); setBookingLocationStep(false) }}>
                    <MapPin size={24} aria-hidden="true" />
                    <span><strong>Home service</strong><small>We’ll confirm the travel fee with your quote</small></span>
                  </button>
                </div>
              </section>
            ) : (
              <>
                <div className="booking-modal__form-heading">
                  <span className="booking-modal__eyebrow">Consultation Request · {bookLocation === 'home' ? 'Home service' : 'At the studio'}</span>
                  <h3 id="booking-modal-title" className="booking-modal__title">Book Your Session</h3>
                </div>

                <form onSubmit={handleBookingSubmit} className="booking-modal__form">
                  <div className="booking-modal__field-row">
                    <div>
                      <label className="booking-modal__field-label" htmlFor="booking-name">Your Name</label>
                      <input 
                        id="booking-name"
                        type="text" 
                        required
                        value={bookName}
                        onChange={(e) => setBookName(e.target.value)}
                        placeholder="Full name" 
                        className="booking-modal__text-input"
                      />
                    </div>
                    <div>
                      <label className="booking-modal__field-label" htmlFor="booking-phone">Phone Number</label>
                      <div className="booking-modal__phone-input">
                        <input
                          id="booking-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          pattern="09[0-9]{9}"
                          maxLength={11}
                          required
                          value={bookPhone}
                          onChange={(event) => setBookPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                          placeholder="09123456789"
                          aria-label="11-digit phone number starting with 09"
                          className="booking-modal__phone-number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={bookLocation === 'home' ? 'booking-modal__field-row' : undefined}>
                    <div>
                      <label className="booking-modal__field-label" htmlFor="booking-email">Email Address</label>
                      <input
                        id="booking-email"
                        type="email"
                        required
                        value={currentUser?.email || ''}
                        readOnly
                        placeholder="name@example.com"
                        className="booking-modal__text-input"
                      />
                    </div>
                    {bookLocation === 'home' && <div>
                      <div className="booking-home-address-field">
                        <label className="booking-modal__field-label" htmlFor="booking-address">Home Visit Address</label>
                        <input id="booking-address" type="text" required maxLength={300} value={bookAddress} onChange={(event) => setBookAddress(event.target.value)} placeholder="Street, barangay, city" className="booking-modal__text-input" aria-describedby="home-service-fee-note" />
                        <p id="home-service-fee-note" role="tooltip" className="booking-modal__home-service-note">The home-service travel fee will be included in your quote before you pay the deposit.</p>
                      </div>
                    </div>}
                  </div>

                  <div className="booking-modal__field-row">
                    <div>
                      <label className="booking-modal__field-label" htmlFor="booking-style">Preferred Style</label>
                      <select 
                        id="booking-style"
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
                      <label className="booking-modal__field-label" htmlFor="booking-size">{bookStyle.startsWith('Flash:') ? 'Flash Size' : 'Estimated Size'}</label>
                      <select 
                        id="booking-size"
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

                  <div>
                    <label className="booking-modal__field-label" htmlFor="booking-placement">Tattoo Placement</label>
                    <input
                      id="booking-placement"
                      type="text"
                      required
                      maxLength={120}
                      value={bookPlacement}
                      onChange={(event) => setBookPlacement(event.target.value)}
                      placeholder="e.g. left forearm"
                      className="booking-modal__text-input"
                    />
                  </div>

                  <div className="booking-modal__date-time-row">
                    <div className="booking-modal__field">
                      <span className="booking-modal__field-label">Choose Date</span>
                      <div className="booking-date-picker" ref={calendarPickerRef}>
                      <button
                        type="button"
                        className="booking-date-picker__trigger"
                        aria-haspopup="dialog"
                        aria-expanded={isCalendarOpen}
                        onClick={() => setIsCalendarOpen((open) => !open)}
                      >
                        <span className={bookDate ? '' : 'booking-date-picker__placeholder'}>{selectedDateLabel}</span>
                        <span className="booking-date-picker__icons">
                          <CalendarDays size={18} aria-hidden="true" />
                          <ChevronDown size={16} aria-hidden="true" className={isCalendarOpen ? 'is-open' : ''} />
                        </span>
                      </button>
                      {isCalendarOpen && <div className="booking-date-picker__dropdown">
                      <div className="booking-calendar" role="dialog" aria-label="Appointment availability calendar">
                      <div className="booking-calendar__header">
                        <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} disabled={calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() === new Date().getMonth()}>
                          <ChevronLeft size={18} />
                        </button>
                        <strong>{monthLabel}</strong>
                        <button type="button" aria-label="Next month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                      <div className="booking-calendar__grid" role="grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => <span className="booking-calendar__weekday" role="columnheader" key={weekday}>{weekday}</span>)}
                        {calendarCells.map((date, index) => {
                          if (!date) return <span className="booking-calendar__blank" aria-hidden="true" key={`blank-${index}`} />
                          const isUnavailable = unavailableDates.includes(date)
                          const isAvailable = !isUnavailable && !availabilityError
                          const isPast = date < todayKey
                          const stateClass = isUnavailable ? 'unavailable' : isPast ? 'past' : availabilityError ? 'empty' : 'available'
                          const selected = bookDate === date
                          return <button
                            type="button"
                            role="gridcell"
                            key={date}
                            disabled={!isAvailable || isPast || availabilityLoading || Boolean(availabilityError)}
                            aria-pressed={selected}
                            aria-label={`${new Date(`${date}T12:00:00`).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}: ${availabilityError ? 'Availability could not be loaded' : isUnavailable ? 'Temporarily held or confirmed booking' : isPast ? 'Past date' : 'Available to request'}`}
                            className={`booking-calendar__day booking-calendar__day--${stateClass}${selected ? ' is-selected' : ''}`}
                            onClick={() => chooseDate(date)}
                          >{Number(date.slice(-2))}</button>
                        })}
                      </div>
                      <div className="booking-calendar__legend" aria-label="Calendar legend">
                        <span><i className="is-green" /> Available</span>
                        <span><i className="is-red" /> Unavailable</span>
                      </div>
                    </div>
                      </div>}
                      </div>
                    </div>
                    <div className="booking-modal__field">
                      <span className="booking-modal__field-label">Preferred Time</span>
                      <div className="booking-time-inputs">
                        <div className="booking-time-values">
                          <input
                            id="requested-time-hour"
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            pattern="[1-9]|1[0-2]"
                            required
                            aria-label="Hour"
                            placeholder="HH"
                            value={timeHour}
                            onChange={(event) => {
                              const value = event.target.value.replace(/\D/g, '').slice(0, 2)
                              if (value && (Number(value) < 1 || Number(value) > 12)) return
                              setTimeHour(value)
                              updateBookingTime(value, timeMinute, timePeriod)
                            }}
                            className="booking-modal__text-input booking-time-number"
                          />
                          <span className="booking-time-colon" aria-hidden="true">:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            pattern="[0-9]{1,2}"
                            required
                            aria-label="Minutes"
                            placeholder="00"
                            value={timeMinute}
                            onChange={(event) => {
                              const value = event.target.value.replace(/\D/g, '').slice(0, 2)
                              if (value && Number(value) > 59) return
                              setTimeMinute(value)
                              updateBookingTime(timeHour, value, timePeriod)
                            }}
                            className="booking-modal__text-input booking-time-number"
                          />
                        </div>
                      <select
                        aria-label="AM or PM"
                        value={timePeriod}
                        onChange={(event) => {
                          setTimePeriod(event.target.value)
                          updateBookingTime(timeHour, timeMinute, event.target.value)
                        }}
                        className="booking-modal__select-input booking-time-period"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      </div>
                    </div>
                  </div>
                  {availabilityError && <p className="booking-modal__error-message" role="alert">{availabilityError}</p>}
                  {availabilityLoading && <p className="booking-modal__schedule-note">Loading pending holds and confirmed booking dates...</p>}
                  <div>
                    <label className="booking-modal__field-label" htmlFor="booking-reference">Reference Image (Optional)</label>
                    <div className="booking-modal__upload-field">
                      <Camera className="booking-modal__upload-icon" />
                      <input 
                        id="booking-reference"
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleReferenceImageChange}
                        className="booking-modal__file-input"
                      />
                    </div>
                    <p className="booking-reference-hint">JPG, PNG, or WebP. Maximum 10 MB.</p>
                  </div>

                  <div>
                    <label className="booking-modal__field-label" htmlFor="booking-notes">Design Concept Notes</label>
                    <textarea 
                      id="booking-notes"
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

