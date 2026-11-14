# Jeu en ligne et tournois

Ce document explique comment marchent les parties en ligne (2 joueurs sur 2 machines) et les tournois.

## Lancer

```bash
bun run dev      # = bun server.ts (dev)          → http://localhost:3000
bun run build && bun run start   # = bun server.ts (production)
```

`bun run dev` ne lance plus `next dev` directement : il lance **`server.ts`**, qui démarre Next.js **et** Socket.IO sur le même port. (`bun run dev:next` lance encore `next dev` seul, sans jeu en ligne.)

Il faut être **connecté** (compte Better Auth, voir `docs/auth.md`). Pour tester seul, il faut un compte par joueur et une session de navigateur par compte : une fenêtre normale + une fenêtre de navigation privée, ou Chrome + Firefox. Deux onglets de la même fenêtre partagent le même cookie, donc le même joueur.

## Vue d'ensemble

```
Navigateur A ─┐                       ┌─ server/match.ts      (une partie, 60 ticks/s)
              ├─ Socket.IO ─ server.ts ─ server/game-server.ts ┤
Navigateur B ─┘   (WebSocket)          └─ server/tournament.ts (le tableau d'un tournoi)
```

| Fichier | Rôle |
| --- | --- |
| `lib/pong/engine.ts` | La physique du Pong (balle, raquettes, rebonds, buts). Fonctions pures, utilisées par le Pong local **et** par le serveur. |
| `lib/pong/protocol.ts` | Les types de tous les messages Socket.IO (client → serveur et serveur → client). |
| `lib/validation/game.ts` | Schémas zod : formulaire de tournoi et tout ce que le serveur reçoit. |
| `server.ts` | Custom server : un serveur HTTP qui sert Next.js et Socket.IO. |
| `server/game-server.ts` | Le « chef d'orchestre » : file d'attente, liste des parties, tournois, messages Socket.IO. |
| `server/match.ts` | Une partie : boucle de jeu, entrées des joueurs, pause, reconnexion, forfait. |
| `server/tournament.ts` | Le tableau d'un tournoi : inscription, tirage, exempts, qualification des vainqueurs. |
| `lib/pong/connection.ts` | Côté navigateur : la connexion Socket.IO unique, ouverte par le header (`components/user-menu.tsx`) sur toutes les pages quand on est connecté. |
| `server/results.ts` | Sauvegarde d'une partie terminée en BDD + XP. |
| `components/online/*` | Les écrans : « connecte-toi », recherche de match, partie, liste et page de tournoi. |

Pages : `/play/online` (recherche), `/play/match/[id]` (la partie), `/play/tournament` (liste + création), `/play/tournament/[id]` (salle d'attente + tableau).

## Le serveur fait autorité

Le navigateur **ne calcule pas** la partie. Il envoie seulement sa direction (`-1` haut, `0` rien, `1` bas), et seulement quand elle change. Le serveur :

1. fait tourner une boucle à **60 ticks/s** (`setInterval` dans `game-server.ts`) ;
2. à chaque tick, avance la physique avec `step()` (en petits pas de 1/240 s pour que la balle ne traverse pas les raquettes) ;
3. envoie à tous les joueurs et spectateurs la position des objets (`match:frame`).

Un joueur ne peut donc pas tricher en modifiant le JS du client : il ne contrôle que sa direction.

### Interpolation côté client

Les positions arrivent environ toutes les 16 ms, mais pas de façon parfaitement régulière (réseau). Le client dessine donc **50 ms dans le passé** et mélange les deux positions reçues autour de ce moment (interpolation linéaire, `interpolate()` dans `online-match.tsx`). Le mouvement reste fluide même si un paquet arrive en retard.

Pour savoir où en est le serveur, le client estime le décalage entre son horloge et celle du serveur (`offsetRef`) à partir de l'heure jointe à chaque frame.

## Déroulé d'une partie (`server/match.ts`)

États (`status`) :

```
waiting ──(les 2 joueurs sont là)──▶ countdown (3 s) ──▶ playing
   │                                     ▲                  │
   │                                     └── paused ◀───────┘ (un joueur se déconnecte)
   └──────────────(trop long)──────────▶ over (forfait)
playing ──(5 points)──▶ over
```

- **waiting** : la partie existe mais un joueur n'est pas encore arrivé. Il a **30 s**.
- **countdown** : 3 s avant le début, et 1 s après chaque point.
- **paused** : un joueur a fermé l'onglet ou perdu la connexion. Il a **15 s** pour revenir, sinon il perd par **forfait**.
- **over** : fini, au score ou par forfait (bouton « Abandonner »).

La partie compte les sockets de chaque joueur. Recharger la page ferme une socket et en ouvre une autre : la partie se met en pause une fraction de seconde, puis repart après le compte à rebours.

## Reconnexion

### Qui est le joueur ?

Le navigateur n'envoie **aucune identité à la main**. Avec la connexion WebSocket, il envoie automatiquement le cookie de session de Better Auth. Le serveur (`authenticate` dans `server/game-server.ts`) demande à Better Auth à quel utilisateur ce cookie appartient (`auth.api.getSession`). Sans cookie valide, la connexion est refusée. Le nom affiché en jeu est le nom d'utilisateur du compte, qui est **unique**.

Comme le joueur est identifié par son compte, il retrouve sa partie après un rechargement, et même depuis un autre onglet :

- sur `/play/match/<id>` : la page renvoie `match:join`, le serveur reconnaît l'identifiant et lui rend **son côté** ;
- sur `/play/online` : la page demande `session:get` et, s'il y a une partie en cours, affiche « Reprendre le match ».

Si c'est le réseau qui coupe (sans recharger), Socket.IO se reconnecte tout seul et la page refait `match:join` dès l'événement `connect`.

## Matchmaking

`queue:join` ajoute le joueur à une file. Dès qu'il y a deux joueurs, le serveur crée une partie, tire les côtés au hasard et envoie `queue:matched` aux deux. Le navigateur va alors sur `/play/match/<id>`.

On ne peut pas entrer dans la file si on a déjà un match à jouer (partie en cours, ou toujours qualifié dans un tournoi en cours).

## Spectateurs

N'importe qui peut ouvrir `/play/match/<id>`. Si son identifiant n'est pas un des deux joueurs, il devient **spectateur** : il reçoit les mêmes images mais ses touches sont ignorées. Pour trouver un match à regarder :

- **`/play/online` → « Matchs en cours »** (`components/online/live-matches.tsx`) : la liste de toutes les parties non terminées (joueurs, score, statut, tournoi ou non), mise à jour en direct. La page s'abonne avec `matches:subscribe` et reçoit `matches:list` à chaque changement (nouvelle partie, point marqué, pause, fin). Sur son propre match, le bouton devient « Reprendre mon match ».
- le tableau d'un tournoi a aussi un bouton « Regarder » sur les matchs en cours.

C'est le module **Mode spectateur** (minor).

## Tournois (`server/tournament.ts`)

1. Quelqu'un crée un tournoi (nom + 4 ou 8 joueurs max) : il en est l'**organisateur**.
2. Les autres le rejoignent depuis la liste (mise à jour en direct).
3. L'organisateur lance le tournoi dès qu'il y a **au moins 3 joueurs**.
4. Tirage au sort, puis tableau à **élimination directe**. Le nombre de places est arrondi à la puissance de 2 au-dessus (3 joueurs → 4 places, 5 → 8). Les places vides donnent des **exempts** (« bye ») : le joueur passe directement au tour suivant. On les répartit pour qu'aucun match n'ait deux places vides.
5. Dès qu'un match a ses deux joueurs, le serveur crée une vraie partie et envoie `tournament:matchReady` aux deux. S'ils sont sur la page du tournoi, ils sont envoyés directement dans la partie.
6. À la fin d'une partie, le vainqueur monte dans la case suivante (`reportResult` → `advance`). Le vainqueur de la finale est le champion.

Un joueur absent perd son match par forfait au bout de 30 s, donc un tournoi ne peut pas rester bloqué.

## Validation (exigée par le sujet)

Tout ce qui arrive au serveur est revérifié avec zod : la session (à la connexion), le formulaire de tournoi (mêmes schémas que côté client), les identifiants et les directions. Un message invalide est ignoré ou renvoie une erreur (`invalid`, `notFound`…), traduite côté client sous `Online.errors.*` / `Tournament.errors.*`.

## Limites actuelles et suite

- **Résultats** : à la fin de chaque partie, `server/results.ts` écrit une ligne `match` (joueurs, score, vainqueur, forfait, tournoi) et donne l'XP, dans une transaction. C'est ce qu'affichent le profil, l'historique et le classement. Les parties et tournois **en cours** restent en mémoire (un redémarrage les efface).
- **Statut en ligne** : `statusOf` dans `game-server.ts` dit si un joueur est en jeu, en ligne (au moins un onglet connecté) ou hors ligne ; les pages le lisent via `lib/presence.ts`.
- **Vercel** ne fait pas tourner `server.ts`. Sur la preview, les pages en ligne affichent « Impossible de joindre le serveur de jeu ». Il faut tester en local ou avec Docker.
- **Docker / nginx** : le conteneur lance `bun run start` (donc `server.ts`), et `nginx.conf` transmet les en-têtes `Upgrade` / `Connection` pour que les WebSockets passent par le HTTPS.
