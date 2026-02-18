# Denk MSL — Call Tracker

This is a small React + Vite app for MSLs to log calls, edit preset messages, and view reports.

Quick local run

```bash
npm install
npm run dev
```

Build for production

```bash
npm run build
npm run preview   # preview the built site locally
```

Deploy to Vercel (two options)

Option A — Deploy via Vercel CLI (fast):

1. Install Vercel CLI (if you don't have it):

```bash
npm install -g vercel
```

2. From the project root run:

```bash
vercel        # follow prompts to link or create a project
vercel --prod # deploy the production build
```

Option B — Deploy via GitHub (recommended for ongoing work):

1. Initialize git, commit and push to a GitHub repo:

```bash
git init
git add .
git commit -m "initial"
# create a repo on GitHub, then:
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to https://vercel.com, import your GitHub repo and set the build command to `npm run build` and the Output Directory to `dist` (Vite default).

Notes
- The app uses `localStorage` as the demo backend — no external services required. For production / multi-user usage I'll help add Firebase/Firestore or another backend.
- Theme colors: primary `#FEED00` (Denk yellow). Night mode toggle is in the UI.

If you want, I can proceed to set up a GitHub repo and deploy from my side — but I'll need access (or you can follow the CLI steps above and I will assist).
