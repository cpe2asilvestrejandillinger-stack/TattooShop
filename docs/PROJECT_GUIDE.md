# AirWizard Tattoo Web App Guide

This guide explains what the AirWizard Tattoo website does, how its features are
built, and how its Supabase database supports them. It is also written as a
reference for an individual project presentation or Q&A.

## 1. Project overview

AirWizard Tattoo is a responsive, client-rendered website for a tattoo studio.
Visitors can view the studio and artist's work, explore an informational pain
guide, estimate a starting price, browse one-of-one flash designs, and request
an appointment. Customers and the studio admin can also use a private chat.

The frontend is a React single-page application built with Vite. It talks
directly to Supabase using the Supabase JavaScript client. There is no separate
application server: Supabase Auth, PostgreSQL, Row Level Security (RLS),
database functions/triggers, Realtime, and Storage provide the backend services.

### Main technologies

| Technology | How the project uses it |
| --- | --- |
| React 19 | Builds the page, reusable UI components, forms, modals, and interactive state. |
| Vite 8 | Serves the app during development and creates the production bundle. |
| Tailwind CSS 4 and CSS | Tailwind is installed with the Vite plugin; the page and components also use project CSS files for layout, responsive styling, and animation. |
| Supabase JS v2 | Connects the browser app to Supabase Auth, PostgreSQL tables, Storage, RPC functions, and Realtime. |
| Supabase PostgreSQL | Stores profiles, appointments, flash designs, messages, schedules, and services; enforces RLS, constraints, and booking rules. |
| Three.js | Loads and renders the interactive anatomy model in the pain guide. |
| Lucide React | Supplies interface icons. |
| ESLint | Checks JavaScript and JSX for code-quality issues. |
| Vercel | Hosts the static production build; `vercel.json` points to `dist`. |

## 2. Feature guide: what it does and how it is built

### Public homepage and navigation

The public page is composed in `src/pages/public/HomePage.jsx`. It includes a
sticky navigation bar, hero area, portfolio, pain guide, estimator, flash
collection, studio location, and social/contact footer. Desktop and mobile
navigation use the same page sections. CSS handles the responsive layouts;
Intersection Observer reveals sections as they enter the viewport and honors
the reduced-motion preference.

The hero's booking buttons call functions passed down from `src/App.jsx`.
`App.jsx` owns the shared state and decides whether a visitor needs to sign in
before booking. The homepage itself is presentation and interaction code; it
does not persist its static marketing content in the database.

### Portfolio gallery and image lightbox

Portfolio records are local data in `src/data/siteData.js`, and their image
files live in `src/assets/`. The homepage maps these records into a repeated
carousel track for the continuous marquee. Clicking a work opens
`src/components/common/PortfolioLightbox.jsx`, which shows its image, title,
and description in a modal.

**Data source:** local JavaScript and static image assets, not Supabase.

### Interactive tattoo pain guide

`src/components/TattooPainChart.jsx` lazily imports Three.js, its GLB loader,
and orbit controls when the viewer approaches the viewport. It then loads
`public/male_anatomy_pain_chart_colored.glb`, creates a scene with camera and
lights, and lets the visitor drag to rotate and scroll to zoom. It pauses
rendering when it is off-screen or the browser tab is hidden, and respects
reduced-motion preferences.

The guide is general placement information, not medical advice or a prediction
of an individual's pain.

### Price estimator

The estimator is part of `HomePage.jsx`. Its style, size, and placement options
are arrays in that component. React state tracks each selection, and the
displayed estimate is the sum of the three selected option prices, formatted
as Philippine pesos. Choosing **Lock in Estimate & Book** passes the selected
style, size, and placement into the booking flow.

The estimate is a frontend guide, not a database quote. The admin reviews the
request and enters the actual tattoo price, any home-service travel fee, and
the requested deposit in the admin panel. The final quote is then saved on the
appointment row.

### Flash design collection and claims

Flash designs are records in `public.designs`; their artwork is stored in the
public `flash-designs` Storage bucket. `App.jsx` loads the design records and
passes them to the homepage. The cards show the artwork, size, price, and
available/claimed state, with carousel controls and an image lightbox.

An admin can add a design in the admin panel. The app validates the image type
(JPG, PNG, or WebP) and 10 MB limit, uploads it to Storage, obtains its public
URL, and inserts the design metadata into `designs`. Admins can toggle
availability or delete a design. Deletion also attempts to remove the stored
artwork.

When a customer claims a design, the app pre-fills a booking with that design's
title, size, and ID. The database trigger `reserve_flash_for_appointment`
marks a design unavailable when its appointment becomes `awaiting_payment` or
`approved`, and prevents two appointments from reserving the same available
design. Rejection or cancellation can release the reservation when no other
active appointment holds it. A pending appointment has not yet reserved the
design.

### Customer registration, sign-in, and password recovery

`src/components/forms/AuthModal.jsx` provides registration, email/password
sign-in, Google sign-in, and password-reset UI. `App.jsx` calls Supabase Auth
methods, restores the saved session on page load, listens for Auth state
changes, and loads the signed-in user's `profiles` row.

The database trigger `on_auth_user_created` calls `handle_new_user()` after a
new Auth user is created. This creates a matching `profiles` row with the
`customer` role. Admin access is a database role, not a role users can choose
in the registration form. A trusted operator must promote an account through
the Supabase dashboard/SQL Editor.

### Appointment booking

The booking flow uses `src/components/forms/BookingModal.jsx` for the screens
and form, with validation and Supabase writes coordinated by `App.jsx`. It
asks the customer to choose a studio or home-service session, then collects
name, phone, tattoo style, size, placement, date, time, description, and an
optional reference image. Home service also requires an address. An estimator
selection or flash claim can pre-fill applicable fields.

Before submitting, the frontend checks that the signed-in user is a customer,
the chosen date is in the future and not reported unavailable, availability
loaded successfully, and the phone/address/image fields are valid. A reference
image is uploaded to the private `appointment-references` bucket under a
customer-specific folder. The app then inserts an `appointments` row with
`status = 'pending'`, the customer's ID, tattoo details, selected date/time,
and the private storage path.

The database applies a two-hour hold to a pending request. An admin can then
quote the request, reject it, or continue to a deposit request. The success
message means the request was received; it is not yet an approved appointment.

#### Booking date behavior and an important limit

The customer chooses a date and enters a time directly in the form. The
availability calendar gets unavailable **dates** from the database function
`get_unavailable_booking_dates()`. A date is unavailable when it has a
confirmed appointment or an unexpired pending/payment hold. The database
function `prevent_booking_on_confirmed_date()` takes an advisory transaction
lock for the date and checks again during insert/update, protecting against
two customers submitting for the same date at almost the same time.

This is currently a **date-level** rule: it permits only one active booking
date-wide, not multiple appointments at different times on the same date.
Although the schema contains a `schedules` table and schedule-validation/
reservation functions, the booking form does not select a `schedule_id`, and
the schedule reservation/release triggers are dropped rather than active.
Therefore, do not describe the current booking form as selecting from
admin-created time slots.

### Booking quote, deposit, and status workflow

The admin appointment panel in
`src/pages/admin/AppointmentManager.jsx` supports searching by customer,
filtering by status, opening a reference image, and taking actions based on
the appointment's current status:

1. **Pending:** request a deposit or reject with a reason.
2. **Awaiting payment:** confirm payment after verifying it, or cancel.
3. **Approved:** mark the appointment complete.
4. **Expired request:** close an expired payment request.

The quote form accepts a tattoo base price and, for a home visit, a travel
fee. It suggests a 30% deposit, lets the admin adjust it, and displays the
remaining balance. Saving the quote updates the appointment to
`awaiting_payment` and writes its amounts and payment state. The admin then
uses chat to send the payment QR. After verifying the deposit in the receiving
account, the admin confirms payment; the database checks that the payment
deadline has not expired and that payment is partial or paid before approval.

The database statuses are `pending`, `awaiting_payment`, `approved`,
`rejected`, `completed`, and `cancelled`. A pending hold lasts two hours; an
awaiting-payment hold lasts 24 hours. On approval, rejection, completion, or
cancellation, the hold is cleared. If a customer sends a payment proof, it is
an image attachment in chat; staff must verify the transfer before approving.
The app does not process or collect payments automatically.

### Customer-to-admin chat and notifications

`src/components/CustomerAdminChat.jsx` implements account-level private
conversations using `public.customer_messages`. Customers see their own
conversation; admins can search customers and open each conversation. Messages
can contain text and optional JPG/PNG/WebP image attachments up to 10 MB.
Admins can mark an image as a payment QR; customers can send payment proof.

Image files go into the private `customer-chat-attachments` bucket. The
database row stores the Storage path, not a public link. The client requests a
short-lived signed URL when it needs to display an attachment. Supabase
Realtime inserts incoming messages into the open conversation without a page
refresh. Unread/read-through indicators are kept in browser `localStorage`;
they are UI state, not database read receipts.

The admin status workflow also posts a booking-update message into the same
customer conversation after changing a booking. If the booking update succeeds
but the chat insert fails, the app reports that the status changed but the
notification could not be sent.

### Admin availability calendar

The admin's Availability tab shows a calendar of dates returned by
`get_unavailable_booking_dates()`. Its displayed states are informational:
past dates, available dates, and dates with a pending hold or confirmed
appointment. The frontend refreshes availability periodically while the
booking or admin calendar is open.

The tab currently does not create, edit, or delete `schedules` rows. The
database has a schedule table and policies for future schedule-slot
functionality, but the live UI calendar reflects active appointment holds and
confirmed bookings instead.

### Location and contact links

The homepage embeds a Google map for JayTATTOO in Malis, Guiguinto, Bulacan and
links to Google Maps directions. The footer has Instagram, Facebook, TikTok,
and telephone links. These are configured in `HomePage.jsx` and do not require
database records.

## 3. How the database works

The Supabase database definition is [`supabase/schema.sql`](../supabase/schema.sql).
It creates/upgrades the app tables, adds constraints and indexes, enables RLS,
sets up database functions and triggers, and configures Storage buckets and
policies. The browser uses the publishable (formerly anon) key; RLS is what
limits what that public client can read or change.

### Tables and relationships

| Table | Purpose | Key relationship/use |
| --- | --- | --- |
| `profiles` | App profile name, phone, role, and creation time. | `id` is the same UUID as `auth.users.id`; new Auth users receive a profile. |
| `appointments` | Requested session details, location, date/time, status, hold expiry, reference path, quote, deposit, balance, and payment status. | `customer_id` references `profiles`; optional `flash_design_id`, `service_id`, and `schedule_id` reference designs/services/schedules. |
| `designs` | Flash title, description, image URL, size, price, and availability. | Referenced by flash appointments; a trigger manages reservation state. |
| `customer_messages` | Customer/admin text and attachment metadata, with message type and timestamp. | Both `customer_id` and `sender_id` reference profiles; `customer_id` identifies the conversation. |
| `schedules` | Potential date/time slots, availability, and non-overlap validation. | `appointments.schedule_id` may reference a slot, but the current booking form does not use it. |
| `services` | Service name, description, price, duration, image, and active flag. | A table and RLS policies exist, but the current frontend does not read or manage services. |

UUIDs identify records. Foreign keys keep references consistent, `CHECK`
constraints restrict allowed statuses and values, and indexes support
appointment date/customer and message-thread queries.

### Database access and RLS

RLS is enabled on the application tables. Policies—not just hidden buttons in
React—enforce the main access boundaries:

- A customer can read their own profile and appointments. Admins can read and
  manage profiles and appointments.
- A customer can update their profile but cannot use that policy to assign
  themselves the `admin` role.
- Customers can insert only their own pending, unpaid appointment with zero
  quote/payment amounts. Admin policies allow booking updates and quote/status
  changes.
- The public can read designs and active services. Admins manage designs and
  services.
- A customer can read/send messages only in their own conversation. Admins
  can read/send messages for customer conversations. Insert policies require
  the sender ID to match the signed-in user and restrict message kinds by role.
- Public users can read schedule rows; only admins can manage them.
- Storage policies separately restrict private booking references and chat
  attachments. Flash artwork is public to read and admin-managed.

`public.is_admin()` checks the signed-in user's `profiles.role` and is reused by
policies and Storage rules. The client-side role check controls the experience;
the database policy is the actual access-control boundary.

### Appointment lifecycle safeguards

`prevent_booking_on_confirmed_date()` runs before appointment inserts and
updates. It serializes same-date changes with an advisory transaction lock,
assigns the appropriate hold expiry, rejects expired transitions, requires a
recorded deposit state before confirming a payment request, and blocks another
active hold or confirmed appointment on that date.

`get_unavailable_booking_dates()` returns occupied dates from today forward.
`reserve_flash_for_appointment()` atomically changes a flash design from
available to claimed when the appointment reaches a reserving status and
raises an error if it was claimed by another request first.

Schedule functions also exist: `validate_schedule_slot()`,
`reserve_schedule_for_appointment()`, and
`release_schedule_after_status_change()`. However, the schema explicitly
drops the schedule reservation/release triggers, and the UI does not submit a
schedule ID. The functions/table should be treated as groundwork, not a
currently enforced part of the customer booking flow.

### Storage buckets

| Bucket | Visibility | What is stored |
| --- | --- | --- |
| `appointment-references` | Private | Customer tattoo reference images. Customers upload into their own folder; the customer and admin can view allowed files. |
| `customer-chat-attachments` | Private; image MIME types and 10 MB size limit | Chat images, payment QR images, and payment proof. Policies limit access to the conversation customer and admins. |
| `flash-designs` | Public read; admin write | Artwork shown in the public flash collection. |

The database stores paths for private files. Signed URLs give temporary access
without making those files public. The chat bucket configuration enforces its
10 MB and allowed-image-type limits, and Storage policies enforce access.
Reference-image type and size checks are performed by the frontend; the
reference bucket's policies enforce customer/admin access.

## 4. Code map

```text
src/
  App.jsx                              Shared state, auth, bookings, Supabase operations
  main.jsx                             React application entry point
  index.css                            Global CSS
  assets/                              Artist, portfolio, and social images
  components/
    CustomerAdminChat.jsx              Customer/admin chat and image attachments
    TattooPainChart.jsx                Lazy-loaded Three.js pain guide
    ConversationPanel.jsx              Legacy appointment-scoped conversation UI
    common/PortfolioLightbox.jsx       Reusable artwork/reference-image modal
    forms/
      AppModals.jsx                    Composes the application's modal components
      AuthModal.jsx                    Registration, sign-in, password recovery
      BookingModal.jsx                 Location step and appointment form
  data/siteData.js                     Static portfolio records
  lib/supabase.js                      Supabase browser client
  lib/appointmentFields.js             Shared appointment select list
  pages/
    public/HomePage.jsx                Public sections and customer navigation
    admin/AppointmentManager.jsx       Admin booking, availability, chat, flash UI
  utils/
    appointmentMappers.js              Maps Supabase rows into UI objects
    formatConversationMessage.js        Formats message content
    formatTime.js                       Appointment time display
supabase/
  schema.sql                           Tables, policies, functions, triggers, storage
public/
  male_anatomy_pain_chart_colored.glb  3D model loaded by the pain guide
docs/
  PROJECT_GUIDE.md                     This guide
```

`ConversationPanel.jsx` is a legacy appointment-scoped component. The current
customer/admin chat uses `customer_messages` in `CustomerAdminChat.jsx`.

## 5. Typical project Q&A

**Q: What problem does the app solve?**

A: It brings the studio portfolio, tattoo information, customer booking
requests, appointment review, and customer/admin follow-up into one responsive
website.

**Q: What is the frontend/backend architecture?**

A: React renders the site and handles interactive form state. Vite bundles and
serves the frontend. The browser calls Supabase directly; Supabase Auth,
PostgreSQL, RLS, SQL functions/triggers, Realtime, and Storage are the backend.
There is no custom Express or Node API server.

**Q: What database do you use, and why?**

A: Supabase provides managed PostgreSQL. Relational tables and foreign keys
model customers, appointments, designs, and messages; PostgreSQL constraints,
RLS, and triggers enforce important rules even when requests come directly
from the browser.

**Q: What happens when someone registers?**

A: Supabase Auth creates the identity. A database trigger creates a
`profiles` row with the same user UUID and a default `customer` role. After
sign-in, React reads the profile to show the user's name and role.

**Q: How are customer and admin permissions different?**

A: React uses the profile role to show the correct UI, while RLS and Storage
policies protect the actual data. Customers can access their own profile,
appointments, and conversation, as well as public catalog and availability
data. Admin actions require an account whose `profiles.role` is set to
`admin` by a trusted operator.

**Q: How does appointment availability avoid conflicts?**

A: The calendar asks a PostgreSQL function for dates with active holds or
confirmed appointments. A trigger checks the date again during the database
write while holding a transaction-level advisory lock. Pending requests hold
the date for two hours and payment requests for 24 hours.

**Q: Does the app book available time slots from the `schedules` table?**

A: Not currently. Customers select a date and enter a time in the form. The
availability and conflict rules currently apply to the whole date. The
schedule table and helper functions exist, but the form does not submit a
`schedule_id` and its reservation triggers are not active.

**Q: How are customer reference images protected?**

A: The app uploads the image to a private Storage bucket under the customer's
UUID folder and writes the file path on the appointment. Storage policies
limit access to that customer and admins. The app creates a short-lived signed
URL when an authorized person opens the image.

**Q: How are flash designs kept one-of-one?**

A: The design's metadata is in `designs` and the artwork is in Storage. A
database trigger changes availability atomically when an appointment reaches
`awaiting_payment` or `approved`. If another request already claimed it, the
trigger rejects the update.

**Q: Does the estimator charge the customer?**

A: No. It adds frontend style, size, and placement values as an initial guide.
The admin provides the actual quote and deposit in the booking panel. Payment
is arranged outside the app; the admin verifies payment before confirming.

**Q: How does chat update without a page refresh?**

A: Messages are stored in `customer_messages`. Supabase Realtime sends new
message inserts to the open conversation. Chat images stay in private
Storage, and short-lived signed URLs are generated for authorized display.

**Q: Which content is stored in PostgreSQL and which is static?**

A: Accounts, appointment requests/quotes/status, flash design metadata, and
messages are database records. Portfolio showcase data, estimator option
prices, marketing text, map/social links, and bundled images are configured
in frontend source/assets.

## 6. Local setup

### Requirements

- Node.js and npm compatible with the Vite version in `package.json`.
- A Supabase project with PostgreSQL, Auth, and Storage enabled.

### Steps

1. Install JavaScript dependencies:

   ```sh
   npm install
   ```

2. Create `.env.local` in the repository root:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Use only the Supabase publishable/anon key in the browser. Never put a
   secret or service-role key in a `VITE_` variable: Vite embeds those values
   in the client bundle.

3. Review and run [`supabase/schema.sql`](../supabase/schema.sql) in the
   Supabase SQL Editor. It contains create and alter statements, so review it
   before applying it to an existing production database.

4. Start the local server:

   ```sh
   npm run dev
   ```

5. Register a test customer. To create an admin, use a trusted Supabase
   dashboard/SQL Editor session to update that user's `profiles.role` to
   `admin`. Do not expose a service-role key in the client.

6. For Google login, enable the Google provider and configure provider
   credentials and allowed redirect URLs in Supabase Auth. Configure email
   confirmation and password-recovery redirect settings to match the project.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Builds the optimized static site into `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint over the repository. |

## 7. Build and deployment

For Vercel, import the repository, configure
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the deployment
environment, and deploy. `vercel.json` uses `npm run build` and `dist` as the
output directory. Add the deployed domain to Supabase Auth's allowed redirect
URLs, including any OAuth and password-recovery callback URLs.

`npm run build` verifies that Vite can produce the production frontend;
`npm run lint` runs the available static checks. Supabase-dependent features
also need to be tested with configured credentials and appropriate customer
and admin accounts.

## 8. Current scope and limitations

- Portfolio images and descriptions and estimator prices are maintained in
  frontend source, not in admin-managed database tables.
- `services` exists in the schema but currently has no connected service
  editor or public service listing in the app.
- There is no dedicated customer appointment-history screen. Customers submit
  requests and receive updates through chat; the admin has the appointment
  management list.
- Booking availability is date-wide, and the form takes a direct time value;
  `schedules` is not currently connected to booking submission.
- Payment QR images and payment proofs support communication only. No card,
  bank, or wallet payment is charged or verified automatically.
- Flash reservations begin at `awaiting_payment` or `approved`, not at the
  initial pending request.
- The pain chart is informational and does not diagnose or predict pain.
- The 3D viewer and modal/chat bundles are deferred to reduce initial page
  loading work. Portfolio artwork is local; database-backed booking, flash,
  chat, and admin functionality requires Supabase configuration.
