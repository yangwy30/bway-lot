# Broadway Lottery Automation Tool 🎭

A high-performance, stealthy automation suite for Broadway Direct, Lucky Seat, and Telecharge lotteries. Built with Next.js, Playwright, and CapSolver.

![Dashboard Preview](./public/images/screenshots/dashboard.png)

## ✨ Features

- **Multi-Site Support**: Broadway Direct, Lucky Seat, and Telecharge (via SocialToaster).
- **Multi-Profile Management**: Enter lotteries for yourself, your family, and your friends with a single click.
- **Smart Automation**: Detects and enters multiple performances (Matinee/Evening) automatically.
- **Stealthy & Safe**: Built-in Turnstile solving and persistent session management.

<div align="center">
  <img src="./public/images/screenshots/profiles.png" width="45%" alt="Profiles Management" />
  <img src="./public/images/screenshots/history.png" width="45%" alt="Automation History" />
</div>

To get this running on your own laptop, follow this guide:

### 1. 📥 Clone the Repository
```bash
git clone https://github.com/yangwy30/bway-lot.git
cd bway-lot
```

### 2. 🛠️ Prerequisites
- **Node.js 18+** installed.
- **CapSolver API Key**: Sign up at [CapSolver](https://www.capsolver.com/) to solve reCAPTCHA and Turnstile challenges automatically.

### 3. 📦 Installation
```bash
# Install all dependencies
npm install

# Install Playwright browser engines
npx playwright install chromium
```

> [!NOTE]
> This tool is optimized for **macOS**. It automatically redirects temporary files to `./data/tmp/` to avoid common permission errors (`EPERM`).

### 4. ⚙️ Configuration
1.  **API Keys**: Create a `.env.local` file in the root:
    ```env
    CAPSOLVER_API_KEY=CAI-8F32... (your key from CapSolver dashboard)
    ```
2.  **Profiles**: Go to the **Management** tab in the app UI to add your name, email, and zip code. This data is stored locally in `data/profiles.json` and never leaves your machine.

### 5. 🚀 Launch
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and you're ready to win!

---
*Developed with love for Broadway fans. High success rates for Aladdin and The Lion King verified.*
## 🛠️ Project "Memory"
For a detailed history of the technical journey, decisions, and collaborative milestones, see [project_history.md](./project_history.md).

## 📅 Future Roadmap (TBD)
Based on our technical evaluation, the next steps for public deployment are:
1. **Supabase Integration**: Move from local JSON storage to Supabase PostgreSQL with Auth + RLS.
2. **GCP Automation Worker**: Migrate Playwright logic to a Google Cloud Run container or Compute Engine VM using GCP credits.
3. **Residential Proxies**: Integrate proxy rotation to avoid IP-based bot detection on cloud servers.
4. **Multi-User Dashboard**: A public-facing UI where friends can securely managed their own credentials.

---
*Developed with love for Broadway fans.*
