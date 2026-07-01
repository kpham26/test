# HocLab — Developer Guide

This guide covers how to maintain and expand the project. If you only read one section, read **"Adding a new course"** — it's the operation you'll do most.

---

## 1. Adding a new course

Everything about a course lives in **one place**: `js/config/courses.config.js`. Nothing elsewhere needs to change.

**Steps:**

1. Drop the new lesson's HTML file into `/lessons/`. Don't rename it if you don't have to.
2. Open the lesson file and add exactly one line near the top of `<head>` (right after the `<title>` tag, before `<style>`), copying the pattern from any existing lesson file:
   ```html
   <script src="../js/lesson-guard.js" data-course-id="YOUR-NEW-COURSE-ID"></script>
   ```
   The `data-course-id` must exactly match the `id` you're about to add below.
3. Add one object to the `COURSES` array in `js/config/courses.config.js`:
   ```js
   {
     id: 'your-new-course-id',        // unique slug — used in URLs and purchase records
     title: 'Full course title',
     shortDesc: 'One line for the course card.',
     description: 'Longer paragraph for the course detail page.',
     subject: 'Toán',                  // or 'Tiếng Anh', or any label you want
     level: 'Lớp 3',
     accentColor: '#1565C0',           // hex — the card's signature accent glow
     accentDeep: '#0D47A1',            // a darker shade of accentColor
     thumbnail: 'assets/images/your-thumbnail.svg',
     isFree: false,
     price: 149000,                    // VND, ignored if isFree is true
     highlights: ['Bullet 1', 'Bullet 2', 'Bullet 3'],
     lessonPath: 'lessons/your-lesson-file.html'
   }
   ```
4. (Optional) Add a thumbnail SVG to `assets/images/`. Copy one of the existing four as a starting template — they're plain SVG, no build step needed.

That's it. The new course now automatically appears on the homepage grid, gets its own course detail page at `courses/course.html?id=your-new-course-id`, works in the purchase flow, and shows up correctly in My Courses — because all four of those read from the same config array.

## 2. Adding more lesson pages to one course (e.g. Lesson 1…Lesson 100)

Right now each course maps to exactly one lesson file (`lessonPath`). To support a *sequence* of lessons under one course:

- Store the lesson files together, e.g. `/lessons/toan-lop-3/lesson-01.html`, `lesson-02.html`, etc.
- Give the course config entry a `lessons: [...]` array instead of a single `lessonPath`, e.g. `lessons: [{id:'l1', title:'Lesson 1', path:'lessons/toan-lop-3/lesson-01.html'}, ...]`.
- Each lesson file still gets the same one-line `lesson-guard.js` integration, with `data-course-id` set to the **course** id (entitlement is checked per-course, not per-lesson, in this MVP).
- The Back button behavior (see below) doesn't change — it always returns to the homepage regardless of which lesson in the sequence you're on.
- `js/pages/course.js` would need a small update to render a lesson list instead of a single "Start" button — everything else (auth, purchases, nav) is unaffected.

## 3. Editing an existing course

All of it — title, description, thumbnail, price, free/paid status, homepage order — is in the same `js/config/courses.config.js` array. Change the field, save, refresh. Reordering the array reorders the homepage grid (courses render in array order).

### Cards, filters, combo pricing, and reviews (all on the homepage)

- **Card tags/checklist**: each course's `tags` array (short pills) and first 2 `highlights` (checkmark bullets) render automatically on its homepage card — edit them in the config, nothing else to touch.
- **Subject filter pills**: built automatically from whatever unique `subject` values exist in `COURSES`, plus a fixed "Miễn phí" pill — add a course with a new subject and a new filter pill appears on its own, in `js/pages/home.js` → `renderFilters()`.
- **Combo discount**: the `COMBO_DISCOUNT` constant at the top of `courses.config.js` (currently `0.20`) is the only place the 20% lives. `HV.getComboPricing()` recomputes the combo's course list and totals from whatever is currently in `COURSES` — add/remove/reprice a paid course and the combo banner and checkout total update automatically, nothing hard-coded.
- **Reviews**: currently static placeholder testimonials in the `REVIEWS` array inside `js/pages/home.js` — swap in real ones (or wire up a small `hv_reviews` storage key later) whenever you have them.

## 4. Editing navigation

The nav bar (and footer) markup and behavior live entirely in `js/ui/nav.js`. Every page includes this same file via `<div id="site-header"></div>` + `<script src=".../js/ui/nav.js"></script>`, so editing it once updates every page automatically — there's no nav markup duplicated anywhere else to keep in sync.

- Nav links (logged-in and logged-out variants) are built in `linksMarkup()`.
- Login/Register/Logout buttons are built in `actionsMarkup()`.
- To add a new menu item, add one line to the `items` array inside `linksMarkup()`.

## 5. Editing authentication

Everything auth-related is in `js/core/auth.js`:
- `register()` — validation rules and account creation
- `login()` — credential checking
- `logout()` — session clearing
- `changePassword(userId, currentPassword, newPassword, confirmNewPassword)` — verifies the current password before saving a new one
- `updateContactInfo(userId, fullName, phone)` — validates phone format and saves both to the user record; called from the checkout page's contact form (`js/pages/checkout.js`), not registration, so signing up stays quick
- User storage key: `hv_users`; session key: `hv_session` (both under the `hv_` prefix from `js/core/storage.js`)

Login/Register **page** behavior (form wiring, redirect-after-login, error display) is separate, in `js/pages/auth-pages.js` — that's the file to edit if you want to change form UX rather than the underlying rules. The change-password form on the account page lives in `js/pages/profile.js` instead, since it's specific to that page rather than shared.

Purchase records are in `js/core/purchases.js`, storage key `hv_purchases` (shape: `{ [userId]: [courseId, ...] }`).

## 6. How the Back button and lesson protection actually work

Every lesson file has exactly one added line, loading `js/lesson-guard.js`. That single script:
1. Hides the page immediately (`opacity:0`) so nothing can flash on screen before the check completes.
2. Loads the same `courses.config.js` / `auth.js` / `purchases.js` every other page uses (via `document.write`, which is the standard, safe pattern for this exact "load more scripts before the parser continues" use case).
3. Calls the exact same `HV.Purchases.hasAccess()` function every other page calls — there is only one implementation of "does this user own this course" in the whole project.
4. If access is granted: injects a slim back-bar (fixed, top of page) and reveals the content, leaving 100% of the lesson's own HTML/CSS/JS untouched.
5. If not: replaces the page with a lock screen pointing to login or checkout, as appropriate.

**Honest limitation:** this is a client-side, UX-level gate — appropriate for a front-end MVP, but not real content protection. Since the whole project is static files with no server, a sufficiently determined visitor could still view-source a paid lesson file directly. Closing that gap requires serving lesson content from a server that checks entitlement before sending the bytes at all — which is exactly what the backend migration below sets up.

## 7. Security notes (please read before this touches a real user)

This project intentionally uses `localStorage` to simulate a backend, per the brief. Two things worth being explicit about:

- **Passwords are not securely hashed.** `js/core/utils.js` → `weakHash()` is a tiny, non-cryptographic hash used only so a password isn't sitting in `localStorage` as obviously-plain text. It is trivially reversible by brute force and offers no real protection. Before this ever handles a real user's real password, authentication needs to move server-side using a proper algorithm (bcrypt or argon2) over HTTPS.
- **`localStorage` is fully readable and editable by the visitor.** Anyone can open devtools, edit their own purchase records, or grant themselves "access" client-side. That's fine for an MVP/demo and is exactly why the lesson guard above is described as a UX-level gate, not security.

Neither of these needs fixing today — they need to be true seams for the backend migration, which is the next section.

## 8. Migrating from `localStorage` to a real backend

Because every page calls `HV.Storage`, `HV.Auth`, `HV.Purchases`, and `HV.getCourse` — never `localStorage` directly — the migration touches a small, contained set of files:

**Files that change:**
| File | What changes |
|---|---|
| `js/core/storage.js` | Replace the `localStorage` calls with `fetch()` calls to your API |
| `js/core/auth.js` | `register()`/`login()` call your `/api/auth/*` endpoints instead of reading/writing `hv_users`; password hashing moves server-side |
| `js/core/purchases.js` | `hasAccess()`/`purchaseCourse()` call your `/api/purchases/*` endpoints; `purchaseCourse()` becomes where you'd integrate Stripe/PayPal |
| `js/config/courses.config.js` | Could stay static, or be replaced with a `fetch()` to `/api/courses` if courses become admin-editable |
| `lessons/*.html` served | Ideally moved behind a server route that checks entitlement *before* sending the file, closing the gap described in section 6 |

**Files that do NOT change:** every HTML page, every file in `js/ui/`, every file in `js/pages/`, and all of `/css`. They only ever call `HV.Auth.x()` / `HV.Purchases.x()` — they have no idea whether those functions talk to `localStorage` or a server, and they don't need to know.

Suggested stack pairings, since the brief mentions several: Node/Express or Django/Laravel/ASP.NET for the API, any SQL/NoSQL database for `users`/`purchases`/`courses` tables, Stripe or PayPal for `purchaseCourse()`, and Firebase/Supabase Auth as a drop-in replacement for `auth.js` if you'd rather not roll your own.

## 9. Admin account

A default admin is seeded automatically the first time the site loads (see `seedAdmin()` in `js/core/auth.js`):

- **Username:** `admin`
- **Password:** `Admin@123`

The admin role currently carries no special UI — it's stored (`role: 'admin'`) and shown as a badge on the profile page, but there's no admin dashboard yet. It's intentionally structured so one can be added later as `admin/dashboard.html` reading the same `HV.COURSES` / `hv_users` / `hv_purchases` data without touching anything else.

## 10. Scalability notes

The architecture in this MVP was chosen specifically so the features listed in the original brief don't require rewrites:
- **Categories / search / filters** — filter `HV.COURSES` client-side in `home.js` before rendering; the config schema already has `subject` and `level` to filter on.
- **Wishlist / cart / coupons / reviews / ratings** — each is a new `hv_*` storage key plus a small module in `js/core/`, following the exact same pattern as `purchases.js`.
- **Progress tracking / certificates / quizzes / assignments** — would hook into the lesson files' own completion state; since none of the four current lessons expose a completion callback, this needs a small addition inside each lesson file when that feature is built (not something the guard script can infer on its own).
- **Instructor pages / discussion boards** — new page + new `js/pages/*.js` controller, reusing `nav.js`, `feedback.js`, and the existing CSS component library as-is.
