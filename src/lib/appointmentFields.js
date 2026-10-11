// Keep the Supabase selection in sync with toAppointment().
export const APPOINTMENT_SELECT =
  'id, customer_id, flash_design_id, appointment_date, appointment_time, tattoo_style, tattoo_size, body_placement, description, reference_image_url, status, booking_hold_expires_at, total_amount, deposit_amount, balance_amount, payment_status, profiles(full_name, phone)'
