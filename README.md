# Iron Cage – MMA Career

A browser MMA career game: build a fighter, climb the rankings, win the belt and retire as a legend.
Runs in any modern browser on phone (landscape), laptop and TV, with touch, keyboard or Xbox controller.

## Repository layout

```
apps/game/            the game – one self-contained index.html (Canvas + vanilla JS, no build step)
deploy/docker/        nginx image that serves the game
deploy/k8s/           Kubernetes manifests (Deployment, Service, Ingress); kustomization.yaml in the root builds the ConfigMap
.github/workflows/    GitHub Pages deploy on every push to main
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
