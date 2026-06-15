# ⌨️ TypeMaster — Premium Typing Speed & Accuracy Trainer

Developed with ❤️ by **[Ajit Pawara](https://github.com/Ajit-pawara)**

TypeMaster is a sleek, modern, and highly interactive typing speed application designed to help developers and typists improve their speed (WPM) and spelling accuracy. It features satisfying mechanical keyboard sound effects, detailed visual telemetry, achievements, and multiple custom training modules.

---

## 🌟 Key Features

*   🔊 **Real-time Mechanical Audio Synthesizer:** Satisfying keypress sound effects (mechanical click, space, enter, and warning chimes) built using the low-latency Web Audio API (reusing a single AudioContext to prevent lag).
*   ⏱️ **Flexible Session Durations:** Practice with custom timers ranging from a quick **30-second** sprint to a **30-minute** endurance session.
*   🔄 **Infinite Typing Flow:** Regular practice sessions will automatically and seamlessly append new text paragraphs as you type, allowing for continuous practice without early cutoffs.
*   📚 **10 Custom Practice Categories:**
    *   **Standard:** Beginner, Intermediate, Advanced, and captivating long Stories.
    *   **Spelling Complexity:** Specialized lists for Easy, Medium, and Hard English spellings.
    *   **Specialty:** Coding snippets (JavaScript/TypeScript/React), Numbers, and Symbols.
*   📊 **Visual Telemetry:** Detailed post-test analytics showing WPM, accuracy %, error count, error heatmaps, and customizable PNG share-card generators.
*   🏆 **Streaks & Leaderboards:** Full registration and profile system to track daily streaks, unlock milestones, and rank on global leaderboards.

---

## 🚀 Quick Start (Run Locally)

### 📋 Prerequisites
Make sure you have the following installed on your machine:
1. **Node.js** (version 22.12.0 or higher recommended)
2. **MongoDB** (running locally on port `27017`)

### 🛠️ Setup Instructions
1.  **Clone your repository and navigate to the folder:**
    ```bash
    cd "/home/robin/Desktop/New jurney/typemaster"
    ```
2.  **Install project dependencies:**
    ```bash
    npm install
    ```
3.  **Launch the development server:**
    ```bash
    npm run dev
    ```
4.  **Open in your browser:**
    Navigate to **[http://localhost:4321](http://localhost:4321)** to start typing!

---

## 🛠️ Technology Stack

*   **Framework:** [Astro](https://astro.build/) (Server-Side Rendering mode)
*   **Frontend Logic:** [React](https://react.dev/) (Interactive test components & state)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Database:** [MongoDB](https://www.mongodb.com/) (User credentials, stats history, streaks, achievements)
*   **Audio Engine:** HTML5 Web Audio API (OscillatorNode & GainNode synthesizer)

---

## 🧞 Command Reference

| Command | Action |
| :--- | :--- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Builds the production standalone server to `./dist/` |
| `npm run preview` | Previews the build output locally |
| `npm run dev -- --host` | Exposes the dev server to your local network |

---
Enjoy typing and leveling up your speed! If you find this project useful, feel free to give it a star on [GitHub](https://github.com/Ajit-pawara/typemaster).
