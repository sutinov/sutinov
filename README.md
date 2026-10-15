# Blagoj Sutinov — Interactive 3D Blueprint CV

An interactive 3D blueprint website CV built with modern WebGL / Three.js, CSS animations, and an off-axis axonometric architectural plan aesthetic.

Inspired by [Ilian Futekov's Blueprint CV](https://futekov3216.github.io/Ilian-Futekov-Bio/).

---

## Features

- **Interactive 3D Architectural Blueprint**: 6 modular 3D blocks (About, Experience, Projects, Education, Skills, Contact) rendered on a drafted blueprint plan.
- **Micro-Interactions**:
  - Hovering a 3D block raises it smoothly with dynamic drop shadows and projects a futuristic cyan hologram tooltip beam.
  - Clicking any 3D zone triggers an animated camera fly-in with a target reticle and loupe zoom readout, followed by an unfolding blueprint detail sheet.
  - Smooth sheet-to-sheet transition navigation (`← PREV`, `NEXT →`, or arrow keys `←` / `→`).
  - Press `Escape` or click `BACK TO PLAN` to zoom back out to the full architectural plan.
  - One-click copy email button with a green holographic status toast.
  - Spoken languages and direct link to download the PDF CV (`assets/Blagoj-Sutinov-CV.pdf`).
- **Mobile & Touch Friendly**:
  - Responsive layout down to small phones and landscape orientations.
  - Virtual viewport joystick and zoom slider for mobile touch control.
  - Bottom sheet quick-navigation bar (`01 ABOUT`, `02 EXP.`, `03 PROJ.`, `04 EDU.`, `05 SKILLS`, `06 CONTACT`).
- **Zero Configuration / 100% Offline Ready**:
  - Includes a self-contained vendor bundle (`js/vendor/three.bundle.js`).
  - Works by simply opening `index.html` in your browser, or running any local web server.
  - Accessible fallback if WebGL is disabled or unavailable.

---

## Project Structure

```
website/
├── index.html                   # HTML entry point with layout & meta tags
├── favicon.svg                  # Blueprint-style SVG favicon
├── assets/
│   └── Blagoj-Sutinov-CV.pdf   # Downloadable PDF CV
├── css/
│   └── styles.css              # Blueprint grid, animations, HUD & sheets
└── js/
    ├── data.js                  # All CV content & 3D zone coordinates
    ├── scene.js                 # Three.js blueprint board & hologram renderer
    ├── app.js                   # Application controller & state machine
    └── vendor/
        └── three.bundle.js      # Bundled Three.js + line modules
```

---

## How to Run Locally

### Option 1: Direct File Opening
Double click `index.html` or drag it into any modern web browser (Chrome, Edge, Firefox, Brave, Safari).

### Option 2: Local HTTP Server (Recommended)
From the `website` directory, run any lightweight local server:

**Using Node.js (npx):**
```bash
npx serve .
# or
npx http-server .
```

**Using Python (if installed):**
```bash
python -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

---

## How to Deploy to GitHub Pages

1. Push this directory or repository to GitHub (e.g. `blagojsutinov/blagojsutinov.github.io` or repository branch `gh-pages`).
2. In your repository on GitHub, go to **Settings** → **Pages**.
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch** and select `main` (or `/root` or `/docs` if placed in docs).
4. Your website will be live at `https://<your-username>.github.io/`!

---

## How to Update Your CV Details

All profile text, experience entries, side projects, education, and skills are stored cleanly in [js/data.js](js/data.js). Simply edit that file to change any details.
