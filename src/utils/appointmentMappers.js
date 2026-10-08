export const toCurrentUser = (authUser, profile) => ({
  id: authUser.id,
  name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Client',
  email: authUser.email || '',
  phone: profile?.phone || '',
  role: profile?.role === 'admin' ? 'admin' : 'customer',
})

export const toAppointment = (row) => ({
  id: row.id,
  customerId: row.customer_id,
  flashDesignId: row.flash_design_id,
  clientName: row.profiles?.full_name || 'Customer',
  phone: row.profiles?.phone || '',
  style: row.tattoo_style,
  size: row.tattoo_size,
  placement: row.body_placement,
  date: row.appointment_date,
  time: row.appointment_time,
  notes: row.description || '',
  status: row.status,
  refImage: row.reference_image_url,
})
