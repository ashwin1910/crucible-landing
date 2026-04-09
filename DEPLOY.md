# Crucible Landing Page — Deployment Guide

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The complete landing page (v5 + enhanced form + Sheets integration) |
| `google-apps-script.js` | Backend code for Google Sheets (copy into Apps Script) |
| `DEPLOY.md` | This file |

---

## Step 1: Set Up Google Sheets Backend (5 min)

This stores all waitlist signups in a Google Sheet with automatic deduplication.

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
   - Name it something like "Crucible Waitlist"

2. Open Google Apps Script:
   - In the Sheet, go to **Extensions → Apps Script**
   - Delete any existing code in `Code.gs`
   - Paste the contents of `google-apps-script.js`
   - Click **Save** (Ctrl+S)

3. Deploy as Web App:
   - Click **Deploy → New deployment**
   - Click the gear icon → Select **Web app**
   - Set **Execute as**: `Me (your email)`
   - Set **Who has access**: `Anyone`
   - Click **Deploy**
   - **Authorize** when prompted (click through the "unsafe" warning — it's your own script)
   - **Copy the Web App URL** — it looks like:
     ```
     https://script.google.com/macros/s/AKfyc.../exec
     ```

4. Paste the URL into `index.html`:
   - Find this line near the top of the `<script>` section:
     ```js
     const SHEETS_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
     ```
   - Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your actual URL

5. Test locally:
   - Open `index.html` in a browser
   - Submit a test email
   - Check your Google Sheet — the row should appear within seconds

### How deduplication works

- When someone submits just an email (step 1), a row is created with `step: email_only`
- If they fill in name/company/role (step 2), the **same row is updated** — no duplicate
- If they visit again with the same email, the existing row is updated, not duplicated
- The Sheet tracks both `created_at` (first visit) and `updated_at` (last interaction)

### Columns in your Sheet

| Column | Description |
|---|---|
| email | Their email (unique key) |
| name | Full name |
| company | Company / org name |
| role | Founder/CEO, CTO, PM, Engineer, etc. |
| use_case | Personal / Small team / Mid team / Large org |
| step | `email_only` or `full_profile` |
| created_at | When they first signed up |
| updated_at | When they last updated their info |

---

## Step 2: Push to GitHub (2 min)

1. Create a new GitHub repo:
   ```bash
   # Option A: GitHub CLI
   gh repo create crucible-landing --public --source=. --remote=origin

   # Option B: Create at github.com/new, then:
   git init
   git add index.html
   git commit -m "Crucible landing page v5 — waitlist with Sheets backend"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/crucible-landing.git
   git push -u origin main
   ```

> **Important**: Only commit `index.html`. Don't commit `google-apps-script.js` or `DEPLOY.md` — those are setup docs, not deployment files. The Apps Script URL in index.html is safe to commit (it only accepts POST writes, no one can read your data from it).

---

## Step 3: Deploy on Vercel (3 min)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub

2. Click **"Add New Project"**

3. Import your `crucible-landing` repo

4. Configure:
   - **Framework Preset**: `Other`
   - **Root Directory**: `.` (default)
   - **Build Command**: leave empty (it's a static HTML file)
   - **Output Directory**: `.` (default)

5. Click **Deploy**

6. Your site will be live at: `https://crucible-landing.vercel.app` (or similar)

### Custom Domain (optional)

1. In Vercel dashboard → Your project → **Settings → Domains**
2. Add your domain (e.g., `crucible.ai` or `getcrucible.com`)
3. Update DNS as instructed (usually an A record or CNAME)

---

## Step 4: Verify Everything Works

1. Visit your Vercel URL
2. Enter a test email in the hero form → should see extended fields appear
3. Fill in the extra fields → should show success message
4. Check your Google Sheet → row should be there with all data
5. Try the same email again → should UPDATE the row, not create a new one
6. Test the bottom CTA form too
7. Test on mobile (responsive check)

---

## For VC Conversations

This setup gives you real, verifiable traction data:

- **Total signups**: Row count in the Sheet
- **Completion rate**: Filter by `step` column — ratio of `full_profile` vs `email_only` shows engagement depth
- **Org breakdown**: Filter/pivot by `company` to show enterprise interest
- **Role distribution**: Pivot by `role` to show who's interested (founders vs engineers vs PMs)
- **Use case demand**: Pivot by `use_case` to show team-size distribution → TAM signal
- **Timeline**: Sort by `created_at` to show growth curve

### Quick Sheets formulas for a VC dashboard

```
Total signups:        =COUNTA(A2:A)
Full profiles:        =COUNTIF(F2:F, "full_profile")
Completion rate:      =COUNTIF(F2:F, "full_profile") / COUNTA(A2:A)
Unique companies:     =COUNTA(UNIQUE(FILTER(C2:C, C2:C<>"")))
Founder signups:      =COUNTIF(D2:D, "Founder / CEO")
Team use (11+):       =COUNTIF(E2:E, "Mid team*") + COUNTIF(E2:E, "Large org*")
```

---

## Architecture Summary

```
User's Browser  →  Static HTML on Vercel (free)
                         ↓ POST (on form submit)
                   Google Apps Script (free)
                         ↓ write
                   Google Sheet (your data)
```

No server, no database, no monthly costs. Scales to thousands of signups on the free tier. You own all the data in a Sheet you can share, export, or connect to any tool.
