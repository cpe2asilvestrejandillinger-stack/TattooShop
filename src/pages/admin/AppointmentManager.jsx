import './AppointmentManager.css'
import { useState } from 'react'
import { Search, X, Trash2, Camera } from 'lucide-react'

export default function AppointmentManager(props) {
  const { isAdminModalOpen, setIsAdminModalOpen, currentUser, adminSearch, setAdminSearch, adminStatusFilter, setAdminStatusFilter, appointmentError, appointments, viewAppointmentReference, updateAppointmentStatus, flashDesigns = [], flashError, flashSubmitting, handleFlashSubmit, deleteFlashDesign, toggleFlashAvailability } = props
  const [flashDraft, setFlashDraft] = useState({ title: '', size: '', price: '', description: '', imageFile: null })
  const [isFlashManagerOpen, setIsFlashManagerOpen] = useState(false)

  const submitFlash = async (event) => {
    const saved = await handleFlashSubmit(event, flashDraft)
    if (saved) setFlashDraft({ title: '', size: '', price: '', description: '', imageFile: null })
  }
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

            <div className="appointment-manager__header">
              <div>
                <span className="appointment-manager__eyebrow">Artist Management</span>
                <h3 className="appointment-manager__title">Appointments Dashboard</h3>
              </div>
              <div className="appointment-manager__toolbar">
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
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button type="button" className="flash-manager__open-button" onClick={() => setIsFlashManagerOpen(true)}>
                  Add 1/1 Design
                </button>
              </div>
            </div>
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
                        <td className="appointment-manager__placement-cell">{app.placement}</td>
                        <td className="appointment-manager__date-cell">{app.date}<br />{app.time}</td>
                        <td className="appointment-manager__standard-cell">
                          <span className={`appointment-status appointment-status--${app.status}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="appointment-manager__action-cell">
                          {app.status === 'pending' && (
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, 'approved')}
                              
                              className="appointment-manager__approve-button"
                            >
                              Confirm
                            </button>
                          )}
                          {app.status === 'approved' && (
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, 'completed')}
                              
                              className="appointment-manager__reject-button"
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

            {isFlashManagerOpen && <div className="flash-manager__backdrop" onMouseDown={(event) => {
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
                <label className="flash-manager__field flash-manager__field--wide">
                  <span className="booking-modal__field-label">Flash Image</span>
                  <span className="booking-modal__upload-field">
                    <Camera className="booking-modal__upload-icon" aria-hidden="true" />
                    <input required type="file" accept="image/jpeg,image/png,image/webp" className="booking-modal__file-input" onChange={(event) => setFlashDraft({ ...flashDraft, imageFile: event.currentTarget.files?.[0] || null })} />
                  </span>
                  <small>JPG, PNG, or WebP. Maximum 10 MB.</small>
                </label>
                <button className="flash-manager__submit booking-modal__submit-button" disabled={flashSubmitting} type="submit">
                  {flashSubmitting ? 'Uploading...' : 'Add 1/1 Design'}
                </button>
              </form>

              {flashError && <p className="appointment-manager__error-message" role="alert">{flashError}</p>}
              <div className="flash-manager__list">
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
            </div>}
          </div>
        </div>
      )}

    </>
  )
}
