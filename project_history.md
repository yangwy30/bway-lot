# Project History: Broadway Lottery Automation

This document preserves the "memory" of the collaboration between the Developer and AI Assistants (Antigravity & Claude) in building this tool.

## 🌈 The Journey

### Phase 1: Foundation & Scrambling
- **Objective**: Automate lottery entries for Broadway Direct, Lucky Seat, and Telecharge.
- **Tools**: Next.js, Playwright (with Stealth Plugin), and CapSolver (for Turnstile/Cloudflare).
- **Milestones**: Successfully bypassed Cloudflare protection on Broadway Direct using specialized solvers.

### 2026-03-23: BroadwayDirect Automation Recovery & "Stop Engine" Feature

### 🚀 Accomplishments
- **BroadwayDirect Recovery**: Resolved critical submission issues for Aladdin and The Lion King (URLs, bot protection, terms checkbox).
- **Emergency Stop**: Implemented a global cancellation mechanism with a dedicated "Stop Engine" button in the dashboard.
- **Bot Protection Mastery**: Built a resilient `BotSolver` with reCAPTCHA v2 support, dynamic callback detection, and 3x retry logic.
- **UI Enhancements**: Improved the enrollment configuration modal with scrolling, "Select All" toggles, and robust default selections.
- **Infrastructure Fixes**: Resolved file permission issues (`EPERM`) by redirecting Playwright's temp directory.

### 🛠️ Key Technical Changes
- **BroadwayDirect Submitter**: Implemented 'Aggressive Nuke' for cookie banners, 'Smart Picker' for country selection, and hardened terms interaction.
- **BotSolver**: Added exponential backoff and dynamic callback search (e.g., `afterCaptcha`, `onCaptchaSubmit`).
- **Automation Engine**: Added `isStopped` flag and integrated it into processing loops for immediate termination.
- **Dashboard UI**: Added scrollable profile list and toggle-all logic to the enrollment modal.

### Phase 2: Telecharge Integration
- **Objective**: Support Telecharge-specific logins via SocialToaster.
- **Decisions**: 
    - Made personal information optional to support "Telecharge-only" profiles.
    - Implemented session handling and login flows for SocialToaster campaigns.

### Phase 3: Robustness & Refinement
- **Bug Fixes**: Resolved critical issues with profile deletion and non-submitting forms in Telecharge.
- **Feature Additions**: Added support for entering **multiple open lotteries** (Matinee & Evening) simultaneously on a single show page.
- **Security**: Isolated session cookies per profile to prevent account interference.

### Phase 4: Scaling & Public Vision
- **Discussion**: Evaluated moving from local-only to a public SaaS model.
- **Tech Stack Proposal**: Next.js (Vercel) + Supabase (Auth/DB) + GCP (Automation Workers).

## 🛠️ Key Technical Decisions
1. **Playwright Stealth**: Used to avoid "bot detection" on high-security lottery sites.
2. **Context Isolation**: Created separate browser contexts and storage states per user email to ensure privacy and account safety.
3. **Sequential Processing**: Chose a serial processing queue in the engine to minimize memory footprint and avoid rate-limiting.

## 📂 Version History
- **v1.0.0**: Initial automation for Broadway Direct.
- **v1.1.0**: Added Lucky Seat and basic Telecharge.
- **v1.2.0**: Full Telecharge login support and multi-entry logic.
- **v1.3.0**: Robustness audit and project scrubbing for GitHub.
