import './AppointmentManager.css'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Trash2, Camera, ChevronLeft, ChevronRight, CalendarDays, ClipboardList, Images, Clock3, CheckCircle2, MessageCircle } from 'lucide-react'
import { formatTime } from '../../utils/formatTime'
import CustomerAdminChat from '../../components/CustomerAdminChat'

const localDateString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function AppointmentManager(props) {
  const { isAdminModalOpen, setIsAdminModalOpen, currentUser, unreadConversationIds = [], markConversationRead, unavailableDates = [], availabilityLoading = false, availabilityError = '', adminSearch, setAdminSearch, adminStatusFilter, setAdminStatusFilter, appointmentError, appointments, viewAppointmentReference, updateAppointmentStatus, flashDesigns = [], flashError, flashSubmitting, handleFlashSubmit, deleteFlashDesign, toggleFlashAvailability } = props
  const [flashDraft, setFlashDraft] = useState({ title: '', size: '', price: '', description: '', imageFile: null })
  const [isFlashManagerOpen, setIsFlashManagerOpen] = useState(false)
  const [isFlashDesignListOpen, setIsFlashDesignListOpen] = useState(false)
  const [adminTab, setAdminTab] = useState('appointments')
  const [chatClientId, setChatClientId] = useState('')
  const [rejectingAppointment, setRejectingAppointment] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectingAppointment, setIsRejectingAppointment] = useState(false)
  const [depositAppointment, setDepositAppointment] = useState(null)
  const [quoteBaseAmount, setQuoteBaseAmount] = useState('')
  const [quoteHomeServiceFee, setQuoteHomeServiceFee] = useState('0')
  const [quoteDepositAmount, setQuoteDepositAmount] = useState('')
  const [quoteDepositCustomized, setQuoteDepositCustomized] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(localDateString())
  const [scheduleCalendarMonth, setScheduleCalendarMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1) })
  const requestDeposit = (appointment) => {
    setDepositAppointment(appointment)
    setQuoteBaseAmount('')
    setQuoteHomeServiceFee('0')
    setQuoteDepositAmount('')
    setQuoteDepositCustomized(false)
    setQuoteError('')
  }
  const quoteBase = Number(quoteBaseAmount)
  const quoteTravelFee = depositAppointment?.sessionLocation === 'home' ? Number(quoteHomeServiceFee) : 0
  const quoteTotal = (Number.isFinite(quoteBase) ? quoteBase : 0) + (Number.isFinite(quoteTravelFee) ? quoteTravelFee : 0)
  const suggestedDeposit = Math.ceil(quoteTotal * 0.3)
  const displayedDeposit = quoteDepositCustomized ? quoteDepositAmount : (quoteTotal > 0 ? String(suggestedDeposit) : '')
  const submitDepositRequest = async (event) => {
    event.preventDefault()
    if (!depositAppointment || isSavingQuote) return
    const baseAmount = Number(quoteBaseAmount)
    const homeServiceFee = depositAppointment.sessionLocation === 'home' ? Number(quoteHomeServiceFee) : 0
    const totalAmount = baseAmount + homeServiceFee
    const depositAmount = Number(displayedDeposit)
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
      setQuoteError('Enter a tattoo price greater than PHP 0.')
      return
    }
    if (!Number.isFinite(homeServiceFee) || homeServiceFee < 0) {
      setQuoteError('Enter a valid home-service fee of PHP 0 or more.')
      return
    }
    if (!Number.isFinite(depositAmount) || depositAmount <= 0 || depositAmount > totalAmount) {
      setQuoteError('The downpayment must be greater than PHP 0 and no more than the total price.')
      return
    }
    setQuoteError('')
    setIsSavingQuote(true)
    try {
      const updated = await updateAppointmentStatus(depositAppointment.id, 'awaiting_payment', '', { baseAmount, homeServiceFee, totalAmount, depositAmount })
      if (updated) {
        setChatClientId(depositAppointment.customerId)
        setAdminTab('messages')
        setDepositAppointment(null)
      }
    } finally {
      setIsSavingQuote(false)
    }
  }
  useEffect(() => {
    if (!isFlashDesignListOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsFlashDesignListOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isFlashDesignListOpen])
  const scheduleCalendarDays = useMemo(() => {
    const year = scheduleCalendarMonth.getFullYear()
    const month = scheduleCalendarMonth.getMonth()
    const blanks = new Date(year, month, 1).getDay()
    const count = new Date(year, month + 1, 0).getDate()
    return [...Array(blanks).fill(null), ...Array.from({ length: count }, (_, index) => `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`)]
  }, [scheduleCalendarMonth])
  const submitFlash = async (event) => {
    const saved = await handleFlashSubmit(event, flashDraft)
    if (saved) {
      setFlashDraft({ title: '', size: '', price: '', description: '', imageFile: null })
      setIsFlashDesignListOpen(true)
    }
  }
  const submitRejection = async (event) => {
    event.preventDefault()
    if (!rejectingAppointment || !rejectionReason.trim() || isRejectingAppointment) return
    setIsRejectingAppointment(true)
    try {
      const rejected = await updateAppointmentStatus(rejectingAppointment.id, 'rejected', rejectionReason.trim())
      if (rejected) {
        setRejectingAppointment(null)
        setRejectionReason('')
      }
    } finally {
      setIsRejectingAppointment(false)
    }
  }
  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending').length
  const approvedAppointments = appointments.filter((appointment) => appointment.status === 'approved').length
  const availableFlashDesigns = flashDesigns.filter((design) => design.is_available).length
  return (
    <>
      {/* ADMIN DASHBOARD MODAL (PROTECTED) */}
      {isAdminModalOpen && currentUser && currentUser.role === 'admin' && (
        <div className="appointment-manager__modal-backdrop">
          <div className="appointment-manager__modal">
            <button 
              onClick={() => { setIsAdminModalOpen(false); setIsFlashManagerOpen(false) }} 
              className="appointment-manager__close-button"
            >
              <X className="appointment-manager__close-icon" />
            </button>

            <div className="appointment-manager__dashboard">
              <aside className="appointment-manager__sidebar">
                <div className="appointment-manager__brand">
                  <span className="appointment-manager__brand-mark"><CalendarDays size={20} /></span>
                  <span><strong>AirWizard</strong><small>TATTOO STUDIO</small></span>
                </div>
                <span className="appointment-manager__sidebar-label">WORKSPACE</span>
                <nav className="appointment-manager__sidebar-nav" aria-label="Admin dashboard sections">
                  <button type="button" className={adminTab === 'appointments' ? 'is-active' : ''} aria-current={adminTab === 'appointments' ? 'page' : undefined} onClick={() => setAdminTab('appointments')}>
                    <ClipboardList size={17} /> Appointments
                  </button>
                  <button type="button" className={adminTab === 'schedule' ? 'is-active' : ''} aria-current={adminTab === 'schedule' ? 'page' : undefined} onClick={() => setAdminTab('schedule')}>
                    <CalendarDays size={17} /> Availability
                  </button>
                  <button type="button" className={adminTab === 'messages' ? 'is-active' : ''} aria-current={adminTab === 'messages' ? 'page' : undefined} onClick={() => setAdminTab('messages')}>
                    <MessageCircle size={17} /> Conversations{unreadConversationIds.length > 0 && <span className="appointment-manager__unread-dot" aria-label="Unread messages" />}
                  </button>
                  <button type="button" onClick={() => setIsFlashManagerOpen(true)}>
                    <Images size={17} /> Flash designs
                  </button>
                </nav>
                <div className="appointment-manager__sidebar-account">
                  <span className="appointment-manager__account-avatar">{(currentUser.name || 'A').charAt(0).toUpperCase()}</span>
                  <span><strong>{currentUser.name || 'Studio admin'}</strong><small>Administrator</small></span>
                </div>
              </aside>
              <main className="appointment-manager__workspace">
                <header className="appointment-manager__header">
                  <div>
                    <span className="appointment-manager__eyebrow">Studio workspace</span>
                    <h3 className="appointment-manager__title">{adminTab === 'appointments' ? 'Appointments' : adminTab === 'schedule' ? 'Availability' : 'Conversations'}</h3>
                  </div>
                  {adminTab === 'appointments' && <div className="appointment-manager__toolbar">
                    <div className="appointment-manager__search-field">
                      <Search className="appointment-manager__search-icon" />
                      <input
                        type="text"
                        placeholder="Search client..."
                        value={adminSearch}
                        onChange={(event) => setAdminSearch(event.target.value)}
                        className="appointment-manager__search-input"
                      />
                    </div>
                    <select
                      value={adminStatusFilter}
                      onChange={(event) => setAdminStatusFilter(event.target.value)}
                      className="appointment-manager__status-filter"
                      aria-label="Filter appointments by status"
                    >
                      <option value="All">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="awaiting_payment">Awaiting deposit</option>
                      <option value="expired">Hold expired</option>
                      <option value="awaiting_payment_expired">Deposit deadline passed</option>
                      <option value="approved">Approved</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>}
                </header>
                {adminTab !== 'messages' && <><section className="appointment-manager__welcome" aria-label="Admin dashboard overview">
                  <div><span>ADMIN DASHBOARD</span><h4>Welcome back, {(currentUser.name || 'Artist').split(' ')[0]}.</h4><p>Manage bookings, availability, and your 1/1 flash collection.</p></div>
                </section>
                <div className="appointment-manager__stats" aria-label="Studio summary">
                  <article><span className="appointment-manager__stat-icon"><ClipboardList size={17} /></span><div><small>Total bookings</small><strong>{appointments.length}</strong></div></article>
                  <article><span className="appointment-manager__stat-icon"><Clock3 size={17} /></span><div><small>Pending</small><strong>{pendingAppointments}</strong></div></article>
                  <article><span className="appointment-manager__stat-icon"><CheckCircle2 size={17} /></span><div><small>Confirmed</small><strong>{approvedAppointments}</strong></div></article>
                  <button type="button" className="appointment-manager__stat-card" aria-label={`View uploaded flash designs; ${availableFlashDesigns} available`} onClick={() => setIsFlashDesignListOpen(true)}><span className="appointment-manager__stat-icon"><Images size={17} /></span><div><small>Available flash</small><strong>{availableFlashDesigns}</strong></div></button>
                </div></>}
            {adminTab === 'messages' && <CustomerAdminChat currentUser={currentUser} isAdmin initialClientId={chatClientId} onConversationRead={markConversationRead} onClose={() => setAdminTab('appointments')} />}
            {adminTab === 'schedule' && <section className="schedule-manager" aria-labelledby="schedule-manager-title">
              <div className="schedule-manager__heading">
                <div>
                  <span className="appointment-manager__eyebrow">Booking availability</span>
                  <h4 id="schedule-manager-title">Held and confirmed dates are unavailable</h4>
                </div>
                <div className="schedule-manager__legend" aria-label="Calendar legend">
                  <span><i className="is-green" /> Available</span>
                  <span><i className="is-red" /> Pending hold or confirmed booking</span>
                </div>
              </div>
              <div className="schedule-admin-calendar">
                <div className="schedule-admin-calendar__header">
                  <button type="button" aria-label="Previous month" onClick={() => setScheduleCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} disabled={scheduleCalendarMonth.getFullYear() === new Date().getFullYear() && scheduleCalendarMonth.getMonth() === new Date().getMonth()}><ChevronLeft size={18} /></button>
                  <strong>{scheduleCalendarMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</strong>
                  <button type="button" aria-label="Next month" onClick={() => setScheduleCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
                </div>
                <div className="schedule-admin-calendar__grid" role="grid" aria-label="Dates with pending holds or confirmed bookings">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => <span className="schedule-admin-calendar__weekday" role="columnheader" key={weekday}>{weekday}</span>)}
                  {scheduleCalendarDays.map((date, index) => {
                    if (!date) return <span className="schedule-admin-calendar__blank" aria-hidden="true" key={`blank-${index}`} />
                    const isUnavailable = unavailableDates.includes(date)
                    const past = date < localDateString()
                    const state = isUnavailable ? 'unavailable' : past ? 'past' : availabilityError ? 'empty' : 'open'
                    return <button type="button" role="gridcell" key={date} disabled={past} aria-pressed={selectedScheduleDate === date} aria-label={`${date}: ${availabilityError ? 'availability could not be loaded' : isUnavailable ? 'pending hold or confirmed booking' : past ? 'past date' : 'available'}`} className={`schedule-admin-calendar__day schedule-admin-calendar__day--${state}${selectedScheduleDate === date ? ' is-selected' : ''}`} onClick={() => setSelectedScheduleDate(date)}>{Number(date.slice(-2))}</button>
                  })}
                </div>
              </div>
                <div className="schedule-manager__selected-date">
                <strong>{new Date(`${selectedScheduleDate}T12:00:00`).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                <span>{availabilityError ? 'Availability could not be loaded' : unavailableDates.includes(selectedScheduleDate) ? 'Pending hold or confirmed appointment - unavailable to new requests' : selectedScheduleDate < localDateString() ? 'Past date' : 'Available for booking requests'}</span>
              </div>
              {availabilityLoading && <p className="schedule-manager__loading">Refreshing booking holds and confirmed dates...</p>}
              {availabilityError && <p className="appointment-manager__error-message" role="alert">{availabilityError}</p>}
            </section>}
            {adminTab === 'appointments' && <>
            {appointmentError && <p className="appointment-manager__error-message" role="alert">{appointmentError}</p>}
            <div className="appointment-manager__table-scroll">
              <table className="appointment-manager__appointments-table">
                <thead>
                  <tr className="appointment-manager__table-header-row">
                    <th className="appointment-manager__table-heading">Client</th>
                    <th className="appointment-manager__table-heading">Style & Size</th>
                    <th className="appointment-manager__table-heading">Placement</th>
                    <th className="appointment-manager__table-heading">Date</th>
                    <th className="appointment-manager__table-heading">Status</th>
                    <th className="appointment-manager__action-heading">Action</th>
                  </tr>
                </thead>
                <tbody className="appointment-manager__table-body">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="appointment-manager__empty-state">
                        {appointmentError ? 'Bookings could not be loaded.' : 'No booking requests yet.'}
                      </td>
                    </tr>
                  ) : appointments.filter((app) => app.clientName.toLowerCase().includes(adminSearch.toLowerCase()))
                    .filter((app) => adminStatusFilter === 'All' || app.status === adminStatusFilter)
                    .map((app) => (
                      <tr key={app.id} className="appointment-manager__appointment-row">
                        <td className="appointment-manager__standard-cell">
                          <p className="appointment-manager__client-name">{app.clientName}</p>
                          <p className="appointment-manager__secondary-text">{app.phone}</p>
                          {app.refImage && (
                            <button
                              type="button"
                              onClick={() => viewAppointmentReference(app.refImage)}
                              className="appointment-manager__reference-link"
                            >
                              View reference
                            </button>
                          )}
                        </td>
                        <td className="appointment-manager__standard-cell">
                          <p className="appointment-manager__appointment-style">{app.style}</p>
                          <p className="appointment-manager__secondary-text">{app.size}</p>
                        </td>
                        <td className="appointment-manager__placement-cell">
                          {app.placement}
                          <small className="appointment-manager__hold-expiry">
                            {app.sessionLocation === 'home' ? 'Home visit' : 'At the studio'}
                            {app.sessionLocation === 'home' && app.homeServiceAddress ? ` · ${app.homeServiceAddress}` : ''}
                          </small>
                        </td>
                        <td className="appointment-manager__date-cell">{app.date}<br />{formatTime(app.time)}{['pending', 'awaiting_payment'].includes(app.status) && app.holdExpiresAt && <small className="appointment-manager__hold-expiry">Held until {new Date(app.holdExpiresAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })}</small>}{app.status === 'expired' && <small className="appointment-manager__hold-expiry">Pending hold expired; this request cannot be confirmed.</small>}{app.status === 'awaiting_payment_expired' && <small className="appointment-manager__hold-expiry">Deposit deadline passed; request a new booking.</small>}</td>
                        <td className="appointment-manager__standard-cell">
                          <span className={`appointment-status appointment-status--${app.status}`}>
                            {app.status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
                          </span>
                          {app.depositAmount > 0 && <small className="appointment-manager__hold-expiry">Deposit: ₱{app.depositAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} · {app.paymentStatus}</small>}
                        </td>
                        <td className="appointment-manager__action-cell">
                          {app.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => requestDeposit(app)}
                                className="appointment-manager__approve-button"
                                aria-label={`Request downpayment for ${app.clientName}`}
                              >
                                Request deposit
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRejectingAppointment(app); setRejectionReason('') }}
                                className="appointment-manager__reject-button"
                                aria-label={`Reject appointment for ${app.clientName}`}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === 'awaiting_payment' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Confirm that you verified the downpayment in the receiving account?')) updateAppointmentStatus(app.id, 'approved')
                                }}
                                className="appointment-manager__approve-button"
                                disabled={Boolean(app.holdExpiresAt && new Date(app.holdExpiresAt).getTime() <= Date.now())}
                                title="Verify the incoming transfer before confirming"
                              >
                                Confirm payment
                              </button>
                              <button type="button" onClick={() => updateAppointmentStatus(app.id, 'cancelled')} className="appointment-manager__reject-button">
                                Cancel
                              </button>
                            </>
                          )}
                          {app.status === 'awaiting_payment_expired' && (
                            <button type="button" onClick={() => updateAppointmentStatus(app.id, 'cancelled')} className="appointment-manager__reject-button">
                              Close expired request
                            </button>
                          )}
                          {app.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => updateAppointmentStatus(app.id, 'completed')}
                              className="appointment-manager__complete-button"
                            >
                              Complete
                            </button>
                          )}

                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>}
              </main>
            </div>

            {rejectingAppointment && createPortal(
              <div className="appointment-rejection__backdrop" onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isRejectingAppointment) setRejectingAppointment(null)
              }}>
                <form className="appointment-rejection__dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-rejection-title" onSubmit={submitRejection}>
                  <header className="appointment-rejection__header">
                    <div><span>Booking update</span><h3 id="appointment-rejection-title">Reject appointment</h3><p>Let {rejectingAppointment.clientName} know why this request can't be accepted.</p></div>
                    <button type="button" className="flash-manager__close" onClick={() => setRejectingAppointment(null)} disabled={isRejectingAppointment} aria-label="Close rejection dialog"><X size={20} /></button>
                  </header>
                  <label className="appointment-rejection__field" htmlFor="appointment-rejection-reason">Reason</label>
                  <textarea id="appointment-rejection-reason" required minLength={3} maxLength={500} autoFocus value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Add a short reason for the client" />
                  {appointmentError && <p className="appointment-manager__error-message" role="alert">{appointmentError}</p>}
                  <div className="appointment-rejection__actions">
                    <button type="button" onClick={() => setRejectingAppointment(null)} disabled={isRejectingAppointment}>Cancel</button>
                    <button type="submit" disabled={!rejectionReason.trim() || isRejectingAppointment}>{isRejectingAppointment ? 'Rejecting...' : 'Reject appointment'}</button>
                  </div>
                </form>
              </div>,
              document.body,
            )}
            {depositAppointment && createPortal(
              <div className="appointment-quote__backdrop" onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSavingQuote) setDepositAppointment(null)
              }}>
                <form className="appointment-quote__dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-quote-title" onSubmit={submitDepositRequest}>
                  <header className="appointment-quote__header">
                    <div>
                      <span>Booking quote</span>
                      <h3 id="appointment-quote-title">Request downpayment</h3>
                      <p>Set the price for {depositAppointment.clientName}. The quote will be sent in your conversation.</p>
                    </div>
                    <button type="button" className="flash-manager__close" onClick={() => setDepositAppointment(null)} disabled={isSavingQuote} aria-label="Close quote dialog"><X size={20} /></button>
                  </header>
                  <div className="appointment-quote__fields">
                    <label className="appointment-quote__field">
                      <span>Tattoo price <small>(PHP)</small></span>
                      <input autoFocus required type="number" min="0.01" step="0.01" inputMode="decimal" value={quoteBaseAmount} onChange={(event) => { setQuoteBaseAmount(event.target.value); setQuoteError('') }} placeholder="0.00" />
                    </label>
                    {depositAppointment.sessionLocation === 'home' && <label className="appointment-quote__field">
                      <span>Home travel fee <small>(PHP)</small></span>
                      <input required type="number" min="0" step="0.01" inputMode="decimal" value={quoteHomeServiceFee} onChange={(event) => { setQuoteHomeServiceFee(event.target.value); setQuoteError('') }} placeholder="0.00" />
                    </label>}
                  </div>
                  <section className="appointment-quote__summary" aria-label="Quote total">
                    <div><span>Tattoo price</span><strong>₱{(Number.isFinite(quoteBase) ? quoteBase : 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
                    {depositAppointment.sessionLocation === 'home' && <div><span>Travel fee</span><strong>₱{(Number.isFinite(quoteTravelFee) ? quoteTravelFee : 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>}
                    <div className="appointment-quote__total"><span>Total quote</span><strong>₱{quoteTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
                  </section>
                  <label className="appointment-quote__field">
                    <span>Downpayment <small>(PHP · suggested 30%)</small></span>
                    <input required type="number" min="0.01" max={quoteTotal || undefined} step="0.01" inputMode="decimal" value={displayedDeposit} onChange={(event) => { setQuoteDepositCustomized(true); setQuoteDepositAmount(event.target.value); setQuoteError('') }} placeholder="Enter downpayment" />
                  </label>
                  <p className="appointment-quote__balance">Remaining balance: ₱{Math.max(0, quoteTotal - (Number(displayedDeposit) || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                  {quoteError && <p className="appointment-quote__error" role="alert">{quoteError}</p>}
                  <div className="appointment-quote__actions">
                    <button type="button" onClick={() => setDepositAppointment(null)} disabled={isSavingQuote}>Cancel</button>
                    <button type="submit" disabled={isSavingQuote}>{isSavingQuote ? 'Saving quote…' : 'Save quote and open chat'}</button>
                  </div>
                </form>
              </div>,
              document.body,
            )}
            {isFlashManagerOpen && createPortal(
              <div className="flash-manager__backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsFlashManagerOpen(false)
            }}>
            <section className="flash-manager__modal" role="dialog" aria-modal="true" aria-labelledby="flash-manager-title">
              <div className="flash-manager__heading booking-modal__form-heading">
                <div>
                  <span className="booking-modal__eyebrow">1/1 Collection</span>
                  <h4 id="flash-manager-title" className="booking-modal__title">Add a Flash Design</h4>
                  <p className="flash-manager__subtitle">Upload the artwork, set its size and price, then add it to the collection.</p>
                </div>
                <button type="button" className="flash-manager__close" onClick={() => setIsFlashManagerOpen(false)} aria-label="Close flash design manager">
                  <X size={20} />
                </button>
              </div>
              <form className="flash-manager__form" onSubmit={submitFlash}>
                <label className="flash-manager__field">
                  <span className="booking-modal__field-label">Design Name</span>
                  <input required maxLength={100} placeholder="e.g. Hannya & Peony" className="booking-modal__text-input" value={flashDraft.title} onChange={(event) => setFlashDraft({ ...flashDraft, title: event.target.value })} />
                </label>
                <label className="flash-manager__field">
                  <span className="booking-modal__field-label">Size</span>
                  <input required maxLength={60} placeholder="15cm x 8cm" className="booking-modal__text-input" value={flashDraft.size} onChange={(event) => setFlashDraft({ ...flashDraft, size: event.target.value })} />
                </label>
                <label className="flash-manager__field">
                  <span className="booking-modal__field-label">Price (PHP)</span>
                  <input required type="number" min="0" step="1" placeholder="4500" className="booking-modal__text-input" value={flashDraft.price} onChange={(event) => setFlashDraft({ ...flashDraft, price: event.target.value })} />
                </label>
                <label className="flash-manager__field">
                  <span className="booking-modal__field-label">Flash Image</span>
                  <span className="booking-modal__upload-field">
                    <Camera className="booking-modal__upload-icon" aria-hidden="true" />
                    <input required type="file" accept="image/jpeg,image/png,image/webp" className="booking-modal__file-input" onChange={(event) => setFlashDraft({ ...flashDraft, imageFile: event.currentTarget.files?.[0] || null })} />
                  </span>
                  <small>JPG, PNG, or WebP. Maximum 10 MB.</small>
                </label>
                <div className="flash-manager__actions">
                  <button className="flash-manager__submit" disabled={flashSubmitting} type="submit">
                    {flashSubmitting ? 'Uploading...' : 'Add 1/1 Design'}
                  </button>
                </div>
              </form>

              {flashError && <p className="appointment-manager__error-message" role="alert">{flashError}</p>}
            </section>
              </div>,
              document.body,
            )}
            {isFlashDesignListOpen && createPortal(
              <div className="flash-designs-modal__backdrop" onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsFlashDesignListOpen(false)
              }}>
                <section className="flash-designs-modal" role="dialog" aria-modal="true" aria-labelledby="flash-designs-modal-title">
                  <header className="flash-designs-modal__header">
                    <div>
                      <span className="booking-modal__eyebrow">1/1 Collection</span>
                      <h3 id="flash-designs-modal-title">Uploaded Flash Designs</h3>
                      <p>Manage availability and remove designs from your collection.</p>
                    </div>
                    <button type="button" className="flash-manager__close" onClick={() => setIsFlashDesignListOpen(false)} aria-label="Close uploaded designs">
                      <X size={20} />
                    </button>
                  </header>
                  <div className="flash-manager__list flash-designs-modal__list">
                    {flashDesigns.length === 0 ? (
                      <p className="flash-manager__empty">No admin-managed flash designs yet.</p>
                    ) : flashDesigns.map((flash) => (
                      <article className="flash-manager__item" key={flash.id}>
                        <img src={flash.image_url} alt="" />
                        <div className="flash-manager__item-copy">
                          <strong>{flash.title}</strong>
                          <span>{flash.size} · PHP {Number(flash.price || 0).toLocaleString('en-PH')}</span>
                          <span className={flash.is_available ? 'flash-manager__available' : 'flash-manager__taken'}>
                            {flash.is_available ? 'Available' : 'Claimed'}
                          </span>
                        </div>
                        <button type="button" className="flash-manager__toggle" onClick={() => toggleFlashAvailability(flash)}>
                          Mark {flash.is_available ? 'claimed' : 'available'}
                        </button>
                        <button type="button" className="flash-manager__delete" aria-label={`Delete ${flash.title}`} onClick={() => deleteFlashDesign(flash)}>
                          <Trash2 size={16} />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              </div>,
              document.body,
            )}
          </div>
        </div>
      )}

    </>
  )
}
