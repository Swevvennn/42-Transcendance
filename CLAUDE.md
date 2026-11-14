@AGENTS.md

# ft_transcendence — Contexte & modules

<aside>
🎯

**Objectif : 125 % = 19 points validés** (14 obligatoires + 5 de bonus max). On vise **23 points** pour avoir de la marge. Sujet de référence : **v21.1**.

</aside>

# Notation

- **Major = 2 pts, Minor = 1 pt.** 14 pts = 100 %.
- **Bonus plafonné à +5 pts** → 19 pts = 125 %. Au-delà, ça ne rapporte rien.
- **Le bonus est ignoré si la partie obligatoire n'est pas parfaite.**
- Module non fonctionnel ou incomplet à l'éval = **0 pt**.

# Nos choix

- **Jeu** : Pong en 2D sur canvas (l'exemple officiel du sujet).
- **Full-stack** : Next.js (App Router) + Tailwind, avec Route Handlers / Server Actions pour l'API.
- **Temps réel** : custom server (`server.ts`) qui lance Next et `Socket.IO` sur le même port.
- **BDD** : PostgreSQL + Prisma.
- **Auth** : Better Auth (email/mot de passe, OAuth 42, 2FA TOTP).
- **i18n** : next-intl.
- **Infra** : docker-compose (app + postgres) + nginx en HTTPS + Prometheus / Grafana.
- **UI** : shadcn/ui (style `base-lyra`, basé sur base-ui, icônes Phosphor).
- **Validation** : zod, schémas partagés front/back dans `lib/validation/`.
- **Gestionnaire de paquets** : **bun** (plus pnpm).
- **Preview** : le front est déployé sur **Vercel**. Vercel ne fait pas tourner le custom server / Socket.IO, et ne remplace pas le Docker exigé pour l'éval.

# État du projet (2 novembre 2026)

- Le front a été refait de zéro. C'est une preview simple : toutes les pages existent en **EN / FR** (3e langue à choisir), sous `app/[locale]/`.
- Fonctionnel : accueil, login / signup (validation client), menu Play, **Pong local 1v1** (canvas, client uniquement), Privacy / Terms dans le footer, 404.
- **Jeu en ligne + tournoi (12 novembre 2026)** : custom server `server.ts` + Socket.IO, partie serveur à 60 ticks/s, matchmaking, reconnexion (15 s puis forfait), spectateur, tournoi à élimination directe (3 à 8 joueurs). Parties en mémoire. Détails : `docs/online.md`.
- **Better Auth + Prisma 7** : inscription / connexion email + mot de passe, nom d'utilisateur unique, sessions, déconnexion, jeu en ligne réservé aux connectés. BDD de dev : `bun run db:up`. Détails : `docs/auth.md`.
- **Comptes complets (12 novembre 2026)** : 2FA TOTP + codes de secours, connexion 42 (OAuth, à activer avec une app intra), matchs sauvegardés en BDD + XP / niveau, profils réels (le sien et `/profile/<username>`), amis avec statut en ligne, classement depuis la BDD. Docker écoute en HTTPS sur **8443** (`HTTPS_PORT`).
- **14 novembre 2026** : upload d'avatar (stocké en BDD), modification du pseudo / email sur `/settings`, liste des matchs en cours à regarder (spectateur) sur `/play/online`.
- Pas encore fait : mode IA, 3e langue, monitoring.
- Vérifié : `tsc`, `lint` et `build` OK, aucune erreur console Chrome (prod et dev).
- **Explications détaillées pour l'équipe : `docs/frontend.md`.** Règles de code pour les agents : `AGENTS.md`.

# Modules

| Module | Type | Pts | Qui |
| --- | --- | --- | --- |
| Framework front + back (Next.js full-stack) | Major | 2 | Tous |
| ORM (Prisma) | Minor | 1 | 2 — DevOps |
| Monitoring Prometheus + Grafana | Major | 2 | 2 — DevOps |
| Gestion standard des users (profil, avatar, amis, statut en ligne) | Major | 2 | 3 — Auth & users |
| OAuth 2.0 (42) | Minor | 1 | 3 — Auth & users |
| 2FA (TOTP) | Minor | 1 | 3 — Auth & users |
| Jeu web : Pong 2D | Major | 2 | 4 — Moteur |
| Joueurs à distance (+ reconnexion) | Major | 2 | 4 — Moteur |
| Mode spectateur | Minor | 1 | 4 — Moteur |
| IA adversaire | Major | 2 | 5 — Autour du jeu |
| Stats + historique + leaderboard | Minor | 1 | 5 — Autour du jeu |
| Tournoi | Minor | 1 | 5 — Autour du jeu |
| Personnalisation (power-ups, vitesse, taille des raquettes, thèmes) | Minor | 1 | 5 — Autour du jeu |
| Gamification (succès, XP / niveau) | Minor | 1 | 5 — Autour du jeu |
| i18n 3 langues | Minor | 1 | 1 — Front |
| SSR | Minor | 1 | 1 — Front |
| Navigateurs supplémentaires (Firefox + Edge) | Minor | 1 | 1 — Front |
| **Total** |  | **23** |  |

Tâches détaillées de chacun : Feuille de route par personne

# Partie obligatoire

- Web app avec **frontend + backend + base de données**
- **Docker**, lancement en **une seule commande**
- **HTTPS** partout côté navigateur (certificat auto-signé suffit)
- Compatible **Chrome**, **zéro warning / erreur dans la console**
- Pages **Privacy Policy** et **Terms of Service** avec un vrai contenu, accessibles depuis le footer. Sinon rejet.
- **Multi-utilisateurs** simultanés sans conflit
- Front responsive, **framework CSS** (Tailwind)
- `.env` ignoré par Git + `.env.example`
- Schéma de BDD clair avec relations
- Inscription / connexion **email + mot de passe hashé**
- **Validation des formulaires côté front ET back**
- **README** en anglais : 1re ligne en italique avec les logins, rôles, stack, schéma BDD, modules + points, contributions individuelles, usage de l'IA
- Rôles PO, PM, Tech Lead, Devs + commits de tout le monde

# Points d'attention

- **Hydratation Next.js** : pas de `Date.now()`, `Math.random()` ou `window` dans le rendu serveur, sinon erreurs console. Le canvas du jeu en composant client (`"use client"`).
- **Dockerfile en production** : `next build` puis `bun server.ts` (script `bun run start`), jamais `next dev` (warnings dans la console).
- **Jeu côté serveur** : boucle à ~60 ticks/s, les clients envoient seulement haut / bas et reçoivent l'état, interpolation côté client.
- **Reconnexion** : partie en pause quelques secondes, le joueur qui recharge revient dans sa partie, sinon forfait.
- **IA** : doit pouvoir gagner et perdre, jouer « comme un humain » (temps de réaction, erreurs) et gérer les power-ups / options de personnalisation.
- **Dépendance au jeu** : IA, stats, tournoi, spectateur et personnalisation exigent un Pong fonctionnel.
- **i18n** : tout le texte visible est traduit, y compris les erreurs et les pages Privacy / ToS.
- **SSR** : savoir expliquer à l'éval quelles pages sont rendues côté serveur et pourquoi.

# Sources

- Sujet ft_transcendence v21.1 et grille de correction (copies publiques) : github.com/jomunoz42/ft_transcendence
