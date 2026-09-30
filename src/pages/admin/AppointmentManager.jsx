import './AppointmentManager.css'
import { Search, X } from 'lucide-react'

export default function AppointmentManager(props) {
  const { isAdminModalOpen, setIsAdminModalOpen, currentUser, adminSearch, setAdminSearch, adminStatusFilter, setAdminStatusFilter, appointmentError, appointments, viewAppointmentReference, updateAppointmentStatus } = props
  return (
    <>
      {/* ADMIN DASHBOARD MODAL (PROTECTED) */}
      {isAdminModalOpen && currentUser && currentUser.role === 'admin' && (
        <div className="appointment-manager__c57be499">
          <div className="appointment-manager__303e9e49">
            <button 
              onClick={() => setIsAdminModalOpen(false)} 
              className="appointment-manager__404bb319"
            >
              <X className="appointment-manager__a8600f1b" />
            </button>

            <div className="appointment-manager__e0ae5739">
              <div>
                <span className="appointment-manager__90cbbb9d">Artist Management</span>
                <h3 className="appointment-manager__a8f3173f">Appointments Dashboard</h3>
              </div>
              <div className="appointment-manager__7c8c9395">
                <div className="appointment-manager__6211b4b1">
                  <Search className="appointment-manager__9c7ef073" />
                  <input
                    type="text"
                    placeholder="Search client..."
                    value={adminSearch}
                    onChange={(event) => setAdminSearch(event.target.value)}
                    className="appointment-manager__10e5843a"
                  />
                </div>
                <select
                  value={adminStatusFilter}
                  onChange={(event) => setAdminStatusFilter(event.target.value)}
                  className="appointment-manager__4dac4630"
                  aria-label="Filter appointments by status"
                >
                  <option value="All">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            {appointmentError && <p className="appointment-manager__0272786a" role="alert">{appointmentError}</p>}
            <div className="appointment-manager__1384f66f">
              <table className="appointment-manager__2c311775">
                <thead>
                  <tr className="appointment-manager__720c968f">
                    <th className="appointment-manager__bb5afedd">Client</th>
                    <th className="appointment-manager__bb5afedd">Style & Size</th>
                    <th className="appointment-manager__bb5afedd">Placement</th>
                    <th className="appointment-manager__bb5afedd">Date</th>
                    <th className="appointment-manager__bb5afedd">Status</th>
                    <th className="appointment-manager__50e8b884">Action</th>
                  </tr>
                </thead>
                <tbody className="appointment-manager__ae938a9d">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="appointment-manager__d77ec0de">
                        {appointmentError ? 'Bookings could not be loaded.' : 'No booking requests yet.'}
                      </td>
                    </tr>
                  ) : appointments.filter((app) => app.clientName.toLowerCase().includes(adminSearch.toLowerCase()))
                    .filter((app) => adminStatusFilter === 'All' || app.status === adminStatusFilter)
                    .map((app) => (
                      <tr key={app.id} className="appointment-manager__58fb1251">
                        <td className="appointment-manager__6416d1b5">
                          <p className="appointment-manager__06f00992">{app.clientName}</p>
                          <p className="appointment-manager__3dc37db2">{app.phone}</p>
                          {app.refImage && (
                            <button
                              type="button"
                              onClick={() => viewAppointmentReference(app.refImage)}
                              className="appointment-manager__1770d52d"
                            >
                              View reference
                            </button>
                          )}
                        </td>
                        <td className="appointment-manager__6416d1b5">
                          <p className="appointment-manager__1c29bae3">{app.style}</p>
                          <p className="appointment-manager__3dc37db2">{app.size}</p>
                        </td>
                        <td className="appointment-manager__08e62c7b">{app.placement}</td>
                        <td className="appointment-manager__6fb5a8f3">{app.date}<br />{app.time}</td>
                        <td className="appointment-manager__6416d1b5">
                          <span className={`appointment-status appointment-status--${app.status}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="appointment-manager__83279d67">
                          {app.status === 'pending' && (
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, 'approved')}
                              
                              className="appointment-manager__013ebe91"
                            >
                              Confirm
                            </button>
                          )}
                          {app.status === 'approved' && (
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, 'completed')}
                              
                              className="appointment-manager__9df77220"
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
          </div>
        </div>
      )}

    </>
  )
}
