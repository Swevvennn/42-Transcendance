# Comptes (Better Auth) et base de données (Prisma)

## Démarrer en local

```bash
cp .env.example .env        # puis remplir : mot de passe postgres, BETTER_AUTH_SECRET (openssl rand -base64 32)
bun install                 # génère aussi le client Prisma (script postinstall)
bun run db:up               # lance PostgreSQL dans Docker (port 5432, accessible seulement depuis ta machine)
bun run db:migrate          # crée / met à jour les tables
bun run dev                 # http://localhost:3000
```

Autres commandes : `bun run db:down` (arrête la BDD), `bun run db:studio` (interface web pour voir les tables).

`docker-compose.dev.yml` ne contient **que** la base, pour le développement. Le vrai lancement de l'éval reste `docker compose up --build` (`docker-compose.yml` : db + app + nginx), puis **https://localhost:8443**. Au démarrage, le conteneur `app` applique les migrations (`bun run db:deploy`) puis lance `server.ts`.

**Pourquoi 8443 et pas 443 ?** Le Docker « rootless » des postes 42 ne peut pas ouvrir un port inférieur à 1024 (`cannot expose privileged port 443`). Le port se change avec `HTTPS_PORT` dans le `.env` (par exemple `HTTPS_PORT=443` sur une machine où c'est possible) ; `BETTER_AUTH_URL` suit automatiquement. nginx transmet `Host` **avec le port** (`$http_host`) : sans ça, Better Auth et les Server Actions de Next refusent les requêtes (adresse différente de celle du navigateur).

## Pourquoi Prisma 7 et pas Prisma 8

`bun add prisma` installait **Prisma 8.0.0-rc** : une pré-version, avec un fonctionnement complètement différent (« contracts »). Elle demande Node 24, et Better Auth ne sait pas l'utiliser. Le projet utilise donc **Prisma 7.10 (stable)**. Ne pas mettre à jour vers la 8.

Avec Prisma 7 :
- le client est **généré** dans `lib/generated/prisma` (ignoré par git). On l'importe via `import { prisma } from "@/lib/prisma"` ;
- l'adresse de la BDD est dans `prisma.config.ts` (variable `DATABASE_URL`), plus dans le schéma ;
- la connexion passe par `@prisma/adapter-pg`.

## Le schéma (`prisma/schema.prisma`)

| Table | Contenu |
| --- | --- |
| `user` | Un joueur : email (unique), `username` (unique, en minuscules), `displayUsername` (avec la casse tapée), avatar, xp, niveau. |
| `session` | Un navigateur connecté. Le cookie contient un jeton qui pointe vers une ligne ici. Supprimée à la déconnexion. |
| `account` | Une façon de se connecter. Pour email + mot de passe : `providerId = "credential"` et le **mot de passe haché** (scrypt). Plus tard, OAuth 42 ajoutera une ligne `providerId = "42"`. |
| `verification` | Jetons temporaires (vérification d'email, appareils de confiance 2FA…). |
| `twoFactor` | Le secret TOTP et les codes de secours d'un joueur (chiffrés par Better Auth). |
| `friendship` | Demande d'ami entre deux users (`pending` / `accepted`). |
| `match` | Une partie en ligne terminée : joueurs, scores, vainqueur, forfait, tournoi, dates. Écrite par `server/results.ts`. |

Les 5 premières tables sont imposées par Better Auth : ne pas renommer leurs champs. On peut ajouter des champs au `user` (comme `xp`, `level`).

Après un changement du schéma : `bun run db:migrate --name <nom>` crée un fichier dans `prisma/migrations/` (à commiter) et l'applique.

## Comment marche l'auth

- **Serveur** : `lib/auth.ts` configure Better Auth (adaptateur Prisma, email + mot de passe, plugins `username`, `twoFactor`, `genericOAuth` pour 42). Toutes ses routes sont sous `/api/auth/*` (`app/api/auth/[...all]/route.ts`).
- **Navigateur** : `lib/auth-client.ts` fournit `signUp.email`, `signIn.email`, `signOut` et le hook `useSession()`.
- **Session** : après la connexion, Better Auth pose un cookie `httpOnly` (le JS de la page ne peut pas le lire). Il est envoyé automatiquement avec chaque requête, et aussi avec la connexion WebSocket du jeu.
- **Validation front ET back** (exigée par le sujet) : les formulaires valident avec les schémas zod de `lib/validation/auth.ts`, puis `lib/auth.ts` revalide **les mêmes schémas** côté serveur (hook `before`, liste `validatedRoutes` : inscription, connexion, codes 2FA, mot de passe de la 2FA) avant que Better Auth fasse quoi que ce soit. Une erreur renvoie `code: "VALIDATION_FAILED"` et la clé de traduction dans `message`.
- **Pseudo unique** : le plugin `username` refuse un nom déjà pris (`USERNAME_IS_ALREADY_TAKEN`), sans tenir compte des majuscules. Le formulaire affiche l'erreur sous le champ. Même chose pour un email déjà utilisé.
- **Anti-spam** : en production, Better Auth limite le nombre de tentatives (par exemple 3 inscriptions par 10 s). Au-delà, le formulaire affiche « Trop de tentatives ».
- **En-tête** : `components/user-menu.tsx` affiche « Se connecter / S'inscrire » ou le nom + « Se déconnecter ».
- **Jeu en ligne** : `server/game-server.ts` lit la session depuis le cookie à la connexion Socket.IO (voir `docs/online.md`).

## Double authentification (2FA, TOTP)

Plugin `twoFactor` (serveur) + `twoFactorClient` (navigateur).

1. **Activer** (`/settings`, `components/settings/two-factor-settings.tsx`) : le joueur retape son mot de passe → Better Auth crée un secret et 10 codes de secours → la page affiche un **QR code** (lib `qrcode.react`), la clé en texte et les codes → le joueur tape un premier code de son application. La 2FA n'est activée (`user.twoFactorEnabled = true`) **qu'après ce premier code juste** : impossible de se bloquer avec un QR code mal scanné.
2. **Se connecter** : email + mot de passe justes → Better Auth ne crée **pas** encore de session, il répond `twoFactorRedirect: true` et pose un cookie temporaire (10 min). `login-form.tsx` affiche alors `two-factor-step.tsx` : code à 6 chiffres, ou code de secours (utilisable une seule fois). Case « faire confiance à cet appareil » : pas de code pendant 30 jours sur ce navigateur.
3. **Désactiver** : mot de passe sur `/settings`.

Les comptes créés avec 42 n'ont pas de mot de passe : la page explique que leur sécurité se gère sur l'intra (qui a sa propre 2FA). Après plusieurs mauvais codes, Better Auth bloque temporairement le compte (message « Trop de tentatives »).

## Connexion avec 42 (OAuth 2.0)

Plugin `genericOAuth`, fournisseur `42` (dans `lib/auth.ts`). Il n'est activé **que si** `FT_CLIENT_ID` et `FT_CLIENT_SECRET` sont dans le `.env` ; sinon le bouton est grisé avec « La connexion avec 42 n'est pas configurée sur ce serveur » (pas d'erreur console).

**Pour l'activer :**

1. Sur l'intra : https://profile.intra.42.fr/oauth/applications → *Register a new app*.
2. *Redirect URI* : une par adresse utilisée, par exemple `http://localhost:3000/api/auth/callback/42` (dev) et `https://localhost:8443/api/auth/callback/42` (Docker).
3. Copier l'UID dans `FT_CLIENT_ID` et le secret dans `FT_CLIENT_SECRET` (`.env`), puis relancer le serveur.

**Ce qui se passe** : le bouton appelle `signIn.social({ provider: "42" })` → l'intra demande l'autorisation → retour sur `/api/auth/callback/42` → Better Auth lit `https://api.intra.42.fr/v2/me` (login, email, photo). Premier passage : un compte est créé, avec le **login 42 comme nom d'utilisateur** (ou `login_1234` s'il est déjà pris : `freeUsername` dans `lib/auth.ts`) et la photo de l'intra comme avatar. Si un compte email existe déjà avec la même adresse, le compte 42 y est rattaché. En cas d'échec, retour sur `/login?error=…` avec un message traduit.

## Profils, amis, statut en ligne

- `lib/users.ts` : toutes les lectures BDD des pages (profil, stats, historique, classement, amis).
- `/profile` : son propre profil (redirige vers `/login` si on n'est pas connecté). `/profile/<username>` : le profil public de n'importe qui, avec le bouton « Ajouter en ami / Accepter / Retirer ».
- **Amis** : table `friendship` (`pending` puis `accepted`). Les actions sont des **Server Actions** (`lib/actions/friends.ts`) : le serveur relit la session et revalide l'entrée avec zod (`lib/validation/friends.ts`). Si A demande B alors que B avait déjà demandé A, la demande est simplement acceptée.
- **Statut en ligne** (`lib/presence.ts`) : le serveur de jeu sait qui a une connexion Socket.IO ouverte, et qui a un match à jouer. Le header ouvre cette connexion sur **toutes** les pages quand on est connecté. Résultat : « En ligne », « En jeu » ou « Hors ligne ».
- **XP / niveau** (`lib/xp.ts`) : +100 XP par victoire, +25 par défaite, un niveau tous les 250 XP.

## Modifier son profil et son avatar (`/settings`)

- **Nom d'utilisateur et email** : formulaire `ProfileForm` (`components/settings/profile-settings.tsx`) → Server Action `updateProfile` (`lib/actions/profile.ts`). Mêmes règles des deux côtés : `profileSchema` dans `lib/validation/profile.ts`. Le serveur relit la session, refuse un pseudo ou un email déjà pris (erreur affichée sous le champ), et stocke le pseudo comme Better Auth (minuscules dans `username`, casse tapée dans `displayUsername`). Après un changement de pseudo, la page rouvre la connexion Socket.IO pour que le jeu affiche le nouveau nom.
- **Avatar** : table `avatar` (l'image est **dans la BDD**, donc rien à monter dans Docker). Le navigateur vérifie le fichier (`avatarSourceSchema` : PNG / JPEG / WebP / GIF, 10 Mo max), le recadre en carré 256×256 et l'envoie en WebP. La Server Action `uploadAvatar` revérifie (`avatarSchema` : type + 512 Ko max) **et** regarde les premiers octets du fichier (un faux `.png` est refusé ; pas de SVG, qui peut contenir du JavaScript). L'image est servie par `app/api/avatar/[id]/route.ts` ; `user.image` vaut `/api/avatar/<id>?v=<date>` pour que le navigateur ne garde pas l'ancienne.
- **Avatar par défaut** : sans image, `UserAvatar` affiche les deux premières lettres du pseudo. « Supprimer » revient à cet avatar par défaut (`removeAvatar`).

## Pour la suite (module Auth & users)

- Changer de mot de passe depuis `/settings` (pas exigé par le sujet).
