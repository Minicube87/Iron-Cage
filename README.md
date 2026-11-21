# Iron Cage – MMA Career

A browser MMA career game: build a fighter, climb the rankings, win the belt and retire as a legend.
Runs in any modern browser on phone (landscape), laptop and TV, with touch, keyboard or Xbox controller.

## Repository layout

```
apps/game/            the game – one self-contained index.html (Canvas + vanilla JS, no build step)
tests/                syntax check, Playwright browser tests (tests/e2e) and balance matrix (tests/balance)
deploy/docker/        nginx image that serves the game
deploy/k8s/           Kubernetes manifests (Deployment, Service, Ingress); kustomization.yaml in the root builds the ConfigMap
.github/workflows/    CI on every branch/PR, Pages deploy on main (tests first), nightly balance run
design/prototypes/    UI prototypes from Claude Design (.dc.html, open them in Claude Design)
docs/                 plans and notes (e.g. the ground game roadmap)
```

## Play locally

No install needed – open `apps/game/index.html` in a browser, or serve the folder:

```bash
cd apps/game && python3 -m http.server 8080
# open http://localhost:8080
```

## Features

- **Career mode** – 3 divisions (LW / WW / MW), 30 fighters each, weekly fight cards, rankings, title fights over 5 rounds, mandatory defenses, rest weeks, rivalries and news.
- **Real-world rankings option** – start in a division seeded with renamed versions of the current top 15.
- **10 fighting classes** – Boxer, Kickboxer, Brawler, Muay Thai, Counter Striker, Pressure Fighter, Knockout Artist, Karateka, Ground & Pound and Iron Guard, each with a strength and a weakness. Weaknesses fade for elite fighters (78+ OVR).
- **Fight engine** – jabs, crosses, low/high kicks, charged power shots, ducking, blocking, high guard, combos with escalating knockdown chance, flash knockdowns and a ground & pound finish.
- **Adaptive AI** – elite opponents (76+ OVR) learn your patterns during a fight and start reading repeated combinations.
- **Roster ecosystem** – fighters gain and lose form, age, retire or get released after losing streaks; new signings, star prospects and rare generational talents join over time.
- **Calendar** – simulate up to a date; the sim stops when your input is needed (title fight, mandatory defense, rival).
- **Legends** – retire as a champion and your fighter returns as a legend in future careers; separate Legends mode with 26 fictional greats.
- **Fighter avatars** – drawn portraits (hair, beard, scars, cauliflower ears …) with an in-game editor.
- **Hub layouts** – Poster, Console (controller-first) or Classic, plus a *Tale of the Tape* screen before every fight.
- **Local versus** – 1 v 1 on one screen with two controllers or keyboard.
- **Controller support** – full menu navigation, on-screen keyboard, sliders, View button toggles fullscreen.
- **Fight log** – the last 60 fights are stored with detailed stats for balancing.
- **Saves** – careers are stored in `localStorage` (when hosted as a Claude artifact they also sync online).

## Controls

| Action | Touch | Keyboard | Xbox controller |
|---|---|---|---|
| Move / circle | left thumb | WASD / arrows | left stick / d-pad |
| Jab · Cross | buttons | J · K | X · Y |
| Low kick · High kick | buttons | U · I | A · B |
| Block | button | L | RB / RT |
| Duck | button | Space | LB / LT |
| Pause | ⏸ | Esc | Menu |
| Fullscreen | ⛶ | ⌃⌘F / F11 | View |

(Exact bindings are also shown in the in-game *How to play* panel and the Guide.)

## Tests & CI

```bash
npm install
npx playwright install chromium   # once
npm test                          # syntax check + browser tests (~30 s)
npm run test:balance              # AI-vs-AI balance matrix (slow, several minutes)
```

| Workflow | When | What |
|---|---|---|
| `ci.yml` | every push to a feature branch, every pull request | syntax check of the game script, Playwright tests: career flow, all hub tabs and layouts, rankings, 20 simulated weeks, guide/settings, controller (menu, on-screen keyboard, sliders, rankings, after a fight), screenshots in 3 sizes, render-time budget |
| `pages.yml` | push to `main` | runs `ci.yml` first – the game is only published when every test passes |
| `balance.yml` | nightly and on demand | every class vs. reference opponents with sides swapped; fails if a class leaves the 20–80 % window or a mirror match shows a side bias |

Screenshots and reports are attached to each run as the `playwright-report` artifact.
Tip: protect `main` (*Settings → Branches*) and require the **CI** checks before merging.

## Deploy

### GitHub Pages
The workflow in `.github/workflows/pages.yml` publishes `apps/game/` on every push to `main`.
Enable it once: *Settings → Pages → Source: GitHub Actions*.

### Docker

```bash
docker build -t iron-cage -f deploy/docker/Dockerfile .
docker run -p 8080:80 iron-cage
```

### Kubernetes (k3s + Traefik)

```bash
kubectl apply -k . --server-side
```

`--server-side` is required: the game file (~470 KB) is larger than the 256 KB limit of the
`last-applied-configuration` annotation used by a normal client-side `kubectl apply`.
The Ingress serves the game at `http://<host>/iron-cage` – adjust the host in `deploy/k8s/ingress.yaml`.

## Roadmap

See [docs/ground-game-plan.md](docs/ground-game-plan.md) for the planned ground game (takedowns, positions, submissions).
