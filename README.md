# HTMLVault

A front-end MVP for an online course marketplace, selling three interactive Vietnamese Grade-3 lesson files (Math × 2, English × 1) through a full course-browsing, authentication, and purchase flow — built in vanilla HTML/CSS/JS, persisted to `localStorage`, and ready to deploy on GitHub Pages with zero build step.

## Quick start (GitHub Pages)

1. Create a new GitHub repository and push the contents of this folder to it (root of the repo, or into `/docs` — either works, see below).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick the branch (usually `main`) and the folder (`/ (root)`, or `/docs` if you pushed there), then **Save**.
5. GitHub gives you a URL like `https://<username>.github.io/<repo>/` — open it. That's the whole deployment; there is no build step, no `npm install`, no server.

Because every internal link in this project is relative (`css/...`, `../js/...`, never a leading `/`), it works identically whether it's hosted at a domain root (`username.github.io`) or a project subpath (`username.github.io/repo-name/`).

## Try it locally first (optional)

Any static file server works, for example:
```
npx serve .
```
or
```
python3 -m http.server 8080
```
then open `http://localhost:8080`. Opening `index.html` directly via `file://` will *mostly* work, but some browsers restrict `localStorage` or module-like behavior on `file://` — a local server is the more reliable option and matches how GitHub Pages actually serves it.

## Demo accounts

- **Register** a new account anytime via the "Đăng ký" page — registration is fully self-serve.
- A default **admin** account is seeded automatically on first load:
  **username:** `admin` · **password:** `Admin@123`
  (Admin has no special dashboard yet in this MVP — see `docs/DEVELOPER_GUIDE.md` for where to build one.)

## What's actually here

- 1 free course, 2 paid courses, each backed by one of your original lesson HTML files under `/lessons` — **byte-for-byte unchanged except for one added `<script>` line each.**
- Registration / login / logout / persistent sessions, all via `localStorage`.
- A purchase flow that gates the two paid lessons behind login + ownership.
- A single config file (`js/config/courses.config.js`) driving the homepage, course pages, checkout, and My Courses — no course data is hard-coded anywhere else.

Full architecture notes, how to add a new course or lesson, and how this migrates to a real backend later all live in **[`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md)**.

## Project structure

```
index.html                 Homepage (hero + course grid)
courses/course.html        Course detail page — dynamic, driven by ?id=
payment/checkout.html      Purchase flow — dynamic, driven by ?id=
auth/login.html            
auth/register.html
profile/index.html         Account overview
profile/my-courses.html    Purchased / free / locked courses
lessons/                   Your 3 original lesson files (read-only)
css/                        variables · base · components · nav · home · course · auth · profile · lesson-guard
js/
  config/courses.config.js  ⭐ single source of truth for all course data
  core/                     storage.js · auth.js · purchases.js · utils.js
  ui/                       nav.js · feedback.js (toasts/modals) · course-cta.js
  pages/                    one small controller per page
  lesson-guard.js           the one script injected into each lesson file
assets/images/              SVG thumbnails + favicon (no external image dependencies)
docs/DEVELOPER_GUIDE.md
```
