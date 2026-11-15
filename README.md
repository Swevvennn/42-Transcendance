*This project has been created as part of the 42 curriculum by mosmond, aandreo, TODO, TODO, TODO.*

# ft_transcendence

## Description

**Transcendence** is a web application where players compete in **Pong**: local 1v1, against an AI, online in real time, or in tournaments. It includes user accounts, profiles, friends, statistics and a leaderboard, in several languages.

> **Status:** front-end preview. All pages exist (EN/FR) with a playable local Pong; the backend (auth, database, real-time games) is not wired yet. See [`docs/frontend.md`](docs/frontend.md) for details (in French).

A preview of the front-end is deployed on **Vercel**: TODO add URL.

## Instructions

### Requirements

- [Bun](https://bun.sh) ≥ 1.2
- Docker + Docker Compose (for the full stack, once available)

### Run locally (development)

```bash
bun install
bun run dev
```

Open <http://localhost:3000>: you are redirected to `/en` or `/fr`.

### Production build

```bash
bun run build
bun run start
```

### Full stack with Docker

TODO (DevOps): one-command launch with `docker compose up --build`, HTTPS through nginx, `.env.example`.

## Team information

| Login | Role(s) | Responsibilities |
| --- | --- | --- |
| mosmond | TODO (PO / PM / Tech Lead / Dev) | Front-end: pages, i18n, SSR, browsers |
| aandreo | TODO | TODO |
| TODO | TODO | DevOps: Prisma, Docker, monitoring |
| TODO | TODO | Auth & users: accounts, OAuth 42, 2FA, friends |
| TODO | TODO | Game engine: Pong, remote players, spectator mode |
| TODO | TODO | Around the game: AI, stats, tournament, customization, gamification |

## Project management

TODO: how tasks were split and tracked, communication tools, meeting rhythm.

## Technical stack

| Layer | Technology | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) + React 19 | Front and back in one project (Route Handlers / Server Actions), server-side rendering |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (base-ui) | CSS framework required by the subject; accessible, editable components |
| i18n | **next-intl** | Localized routes (`/en`, `/fr`), server and client translations |
| Validation | **zod** | One schema shared by the front-end and the back-end |
| Real time | Socket.IO on a custom server (`server.ts`) | Server-authoritative Pong at ~60 ticks/s |
| Database | PostgreSQL + Prisma 7 | Relational data (users, friends, matches) with a typed ORM |
| Auth | Better Auth | Email/password with unique usernames, OAuth 2.0 with 42, TOTP 2FA |
| Infra | Docker Compose, nginx (HTTPS), Prometheus + Grafana *(planned)* | Single-command launch, monitoring |
| Package manager | **Bun** | Fast installs and scripts |
| Preview hosting | **Vercel** | Front-end preview only (no custom server / WebSockets there) |

## Database schema

TODO (DevOps): diagram and description of tables and relations (users, friendships, matches, tournaments, achievements).

## Features list

| Feature | Status | Who |
| --- | --- | --- |
| Localized pages (EN/FR) with language switcher | Done | mosmond |
| Home, play menu | Done | mosmond |
| Profiles (own + public), friends with online status, leaderboard (from the database) | Done | TODO |
| 2FA (TOTP + backup codes) and login with 42 (OAuth 2.0) | Done | TODO |
| Sign up / log in (Better Auth, validated client- and server-side) | Done | mosmond |
| Privacy Policy and Terms of Service (footer links) | Done | mosmond |
| Local 1v1 Pong (canvas) | Done | mosmond |
| Online games (server-side, reconnection, spectators), tournaments, saved results + XP | Done | TODO |
| AI opponent | TODO | TODO |

## Modules

Target: **23 points** (19 needed for 125 %).

| Module | Type | Points | Owner | Status |
| --- | --- | --- | --- | --- |
| Framework front + back (Next.js) | Major | 2 | All | In progress |
| ORM (Prisma) | Minor | 1 | DevOps | Done |
| Monitoring (Prometheus + Grafana) | Major | 2 | DevOps | TODO |
| Standard user management | Major | 2 | Auth & users | Profiles, friends, online status done; avatar upload TODO |
| Remote authentication (OAuth 2.0, 42) | Minor | 1 | Auth & users | Done (needs a 42 intra app) |
| Two-factor authentication (TOTP) | Minor | 1 | Auth & users | Done |
| Web-based game (Pong 2D) | Major | 2 | Game engine | Local preview |
| Remote players (+ reconnection) | Major | 2 | Game engine | Done |
| Spectator mode | Minor | 1 | Game engine | Done |
| AI opponent | Major | 2 | Around the game | TODO |
| Game statistics and match history | Minor | 1 | Around the game | Done |
| Tournament system | Minor | 1 | Around the game | Done |
| Game customization | Minor | 1 | Around the game | TODO |
| Gamification | Minor | 1 | Around the game | TODO |
| Multiple languages (3) | Minor | 1 | Front | EN/FR done, 3rd TODO |
| Server-Side Rendering | Minor | 1 | Front | Done (all pages pre-rendered per locale) |
| Additional browsers (Firefox + Edge) | Minor | 1 | Front | TODO |
| **Total** | | **23** | | |

## Individual contributions

- **mosmond** — Front-end rebuild: Next.js 16 App Router structure, next-intl (EN/FR, localized routing via `proxy.ts`), shadcn/ui components, all pages, shared zod validation schemas, local canvas Pong, Privacy/ToS pages.
- **aandreo** — TODO
- TODO

## Resources

- [Next.js documentation](https://nextjs.org/docs) (the version-matched docs ship in `node_modules/next/dist/docs/`)
- [next-intl documentation](https://next-intl.dev/docs)
- [shadcn/ui](https://ui.shadcn.com) · [Base UI](https://base-ui.com)
- [zod](https://zod.dev)

### Use of AI

Claude (Claude Code) was used to scaffold the front-end preview: page structure, i18n setup, form validation and the local Pong. It also wrote the project documentation (`docs/frontend.md`, `AGENTS.md`, `CLAUDE.md`). All generated code was type-checked, linted, built and tested in Chrome; team members review it before building on it. TODO: each member adds how they used AI.
