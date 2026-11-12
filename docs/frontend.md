# Front — ce qui a été fait et comment continuer

> Rédigé le 2 novembre 2026, après la refonte du front (preview). Ce fichier est destiné à l'équipe : il explique ce qui existe, pourquoi c'est fait comme ça, et comment ajouter des choses sans casser ce qui marche.

## 1. Résumé

Le front a été **repris de zéro** pour coller au `CLAUDE.md` (Pong 2D, Next.js, Tailwind, next-intl). L'ancien front (thème « bataille navale », Three.js, sidebar) a été supprimé.

Ce qu'on a maintenant : une **preview fonctionnelle** de toutes les pages, volontairement **simple** côté style et contenu.

- Stack : Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui (variante base-ui) · next-intl · zod
- Gestionnaire de paquets : **bun** (plus pnpm)
- Langues : **EN / FR** (la 3e langue sera choisie plus tard)
- Déploiement de la preview : **Vercel** (voir § 9)
- Le backend est branché (Better Auth, Prisma, Socket.IO) : voir `docs/auth.md` et `docs/online.md`. Ce document décrit surtout la structure du front.

## 2. Lancer le projet

```bash
bun install
bun run dev      # http://localhost:3000 → redirige vers /en ou /fr
bun run build    # build de prod (à lancer avant de push)
bun run start    # sert le build de prod
bun run lint
bunx tsc --noEmit
```

## 3. Pages

Toutes les URLs sont préfixées par la langue : `/en/...` ou `/fr/...`. `/` redirige vers la langue détectée par next-intl (choix déjà fait sur le site, sinon langue du navigateur, sinon anglais).

| Route | Fichier | Contenu | État |
|---|---|---|---|
| `/` | `app/[locale]/page.tsx` | Accueil, boutons d'action, 3 cartes | ✅ |
| `/login` | `app/[locale]/login/page.tsx` | Formulaire email + mot de passe (+ code 2FA), bouton « 42 » | ✅ |
| `/signup` | `app/[locale]/signup/page.tsx` | Username, email, mot de passe, confirmation | ✅ |
| `/play` | `app/[locale]/play/page.tsx` | Choix du mode (local, IA, en ligne, tournoi) | IA pas encore faite |
| `/play/local` | `app/[locale]/play/local/page.tsx` | Pong 1v1 sur le même clavier | ✅ (client uniquement) |
| `/profile` | `app/[locale]/profile/page.tsx` | Son profil : statut, niveau, XP, stats, historique, amis. `/profile/<username>` : profil public | ✅ (BDD) |
| `/settings` | `app/[locale]/settings/page.tsx` | Activer / désactiver la 2FA | ✅ |
| `/leaderboard` | `app/[locale]/leaderboard/page.tsx` | Classement | ✅ (BDD) |
| `/privacy` | `app/[locale]/privacy/page.tsx` | Politique de confidentialité | ✅ (obligatoire) |
| `/terms` | `app/[locale]/terms/page.tsx` | Conditions d'utilisation | ✅ (obligatoire) |
| 404 | `app/[locale]/not-found.tsx` + `app/[locale]/[...rest]/page.tsx` | Page introuvable traduite | ✅ |

Le header (`components/site-header.tsx`) contient la navigation et le sélecteur de langue. Le footer (`components/site-footer.tsx`) contient les liens Privacy / Terms, **exigés par le sujet** (sinon le projet est rejeté).

## 4. Arborescence

```
app/
  globals.css               thème shadcn (variables CSS) + Tailwind
  favicon.ico
  [locale]/                 toutes les pages sont sous la langue
    layout.tsx              <html>, polices, provider next-intl, header, footer
    page.tsx, login/, signup/, play/, play/local/, profile/,
    leaderboard/, privacy/, terms/, not-found.tsx, [...rest]/
components/
  ui/                       composants shadcn (générés, voir § 6)
  auth/                     formulaires login/signup + hook de validation
  pong/local-pong.tsx       le Pong local (canvas)
  button-link.tsx           lien stylé comme un bouton (voir § 6)
  site-header.tsx, site-footer.tsx, locale-switcher.tsx
  status-badge.tsx          badge en ligne / en partie / hors ligne
  legal-page.tsx            mise en page commune Privacy / Terms
i18n/
  routing.ts                liste des langues + langue par défaut
  navigation.ts             Link, useRouter, usePathname, redirect… localisés
  request.ts                charge les messages de la langue courante
messages/
  en.json, fr.json          toutes les traductions
lib/
  utils.ts                  cn() (fusion de classes Tailwind)
  validation/auth.ts        schémas zod partagés front/back
  users.ts                  lectures BDD des pages (profil, stats, classement, amis)
proxy.ts                    redirection vers /en ou /fr (ex-« middleware »)
global.d.ts                 typage des clés de traduction
docs/frontend.md            ce fichier
```

## 5. Traductions (next-intl)

**Règle du sujet : tout texte visible doit être traduit**, y compris les messages d'erreur et les pages légales.

- Les textes sont dans `messages/en.json` et `messages/fr.json`, rangés par namespace (`Nav`, `Auth`, `Play`, `Game`, `Profile`…).
- **Les deux fichiers doivent avoir exactement les mêmes clés.** TypeScript vérifie les clés utilisées dans le code d'après `en.json` (grâce à `global.d.ts`), mais il **ne vérifie pas** que `fr.json` est complet. Pense à ajouter la clé dans les deux fichiers.
- Dans un composant serveur **async** : `const t = await getTranslations("Namespace")`.
- Dans un composant serveur **non async** ou un composant client : `const t = useTranslations("Namespace")`.
- Pour les liens internes, utilise **`Link` de `@/i18n/navigation`** et non celui de `next/link` : il ajoute automatiquement le préfixe de langue.
- Chaque page et le layout appellent `setRequestLocale(locale)` : ça permet de pré-rendre les pages en statique. Garde ce pattern dans les nouvelles pages (copie une page existante).

**Ajouter la 3e langue** (ex. `es`) :
1. ajouter `"es"` dans `locales` de `i18n/routing.ts` ;
2. créer `messages/es.json` avec toutes les clés ;
3. ajouter la clé `LocaleSwitcher.es` dans les trois fichiers de messages.

## 6. UI : shadcn

- Les composants sont dans `components/ui/` (style `base-lyra`, basés sur **base-ui** et non Radix, icônes **Phosphor**).
- Pour en ajouter un : `bunx shadcn@latest add <nom>`, par exemple `bunx shadcn@latest add dialog`.
- Les composants shadcn récents importent `cn` depuis le paquet **`cn`** (la lib officielle shadcn qui remplace `clsx` + `tailwind-merge`). `@/lib/utils` ré-exporte le même `cn`.
- **Lien qui ressemble à un bouton : utilise `<ButtonLink>`** (`components/button-link.tsx`), pas `className={buttonVariants()}` sur un `<Link>`. Sans le `cn()` qu'il contient, les classes en conflit ne sont pas fusionnées. C'était un vrai bug : les boutons `outline` n'avaient pas de bordure.
- Icônes Phosphor dans un **composant serveur** : importer depuis `@phosphor-icons/react/ssr`. Dans un composant client : `@phosphor-icons/react`.
- Pas de mode sombre pour l'instant : les variables `.dark` existent dans `globals.css` mais rien ne les active.

## 7. Formulaires et validation

Le sujet exige une **validation côté front ET côté back**.

- Les règles sont dans `lib/validation/auth.ts` (zod) : `loginSchema` et `signupSchema`. **Le backend doit réutiliser ces mêmes schémas** pour valider les données reçues.
- Les messages d'erreur zod sont des **clés de traduction** (`usernameLength`, `emailInvalid`…) traduites dans le namespace `Validation`. Pour ajouter une règle : ajouter le message dans le schéma, dans le type `ValidationKey`, et dans `Validation` de chaque fichier de messages.
- `components/auth/use-form-errors.ts` exécute le schéma et garde la première erreur par champ.
- Les formulaires ont `noValidate` : on désactive les bulles natives du navigateur (qui seraient dans la langue du navigateur et non celle du site) au profit de nos messages traduits.
- Les formulaires appellent Better Auth, qui revalide avec les mêmes schémas (`lib/auth.ts`). Les erreurs serveur sont traduites par `components/auth/auth-error.ts`.

## 8. Le Pong local

`components/pong/local-pong.tsx` est un composant client (`"use client"`) qui dessine sur un `<canvas>` :

- terrain logique de 800 × 500, mis à l'échelle en CSS ;
- W/S pour le joueur gauche, ↑/↓ pour le droit, Espace pour lancer / pause / rejouer ; premier à 5 ;
- physique en sous-pas de 1/240 s pour que la balle rapide ne traverse pas les raquettes ;
- angle de rebond selon l'endroit où la balle touche la raquette, vitesse +5 % par touche (plafonnée) ;
- la partie se met en pause si la fenêtre perd le focus ;
- les couleurs viennent du thème (`text-foreground` / `bg-muted` sur le canvas).

**Important pour l'équipe Moteur** : ce Pong tourne **entièrement dans le navigateur**. C'est une preview. Pour le mode en ligne, le `CLAUDE.md` prévoit une boucle **côté serveur** (~60 ticks/s, Socket.IO) : le client enverra seulement haut/bas et dessinera l'état reçu. Les constantes et la logique de `update()` peuvent servir de base au moteur serveur ; `draw()` peut servir de base au rendu client.

## 9. Déploiement Vercel

La preview du site est déployée sur **Vercel**.

- Vercel détecte **bun** grâce à `bun.lock`. Si le projet Vercel avait une *Install Command* forcée sur `pnpm install` dans ses réglages, **il faut la retirer** : `pnpm-lock.yaml` n'existe plus.
- Le `proxy.ts` (redirection de langue) et les pages pré-rendues fonctionnent sur Vercel sans configuration.
- ⚠️ **Limites de Vercel à connaître :**
  - Vercel ne fait pas tourner de **custom server** (`server.ts`) ni de **WebSocket persistant**. Le temps réel Socket.IO (parties en ligne, statut en ligne, spectateur) **ne marchera pas sur Vercel**. Il faudra soit l'héberger ailleurs, soit se contenter de Vercel pour la preview du front.
  - Le sujet exige pour l'évaluation un lancement **Docker en une commande** avec **HTTPS** : Vercel ne remplace pas `docker-compose` + nginx. Il sert à montrer le front, pas pour l'éval.

## 10. Pièges à éviter (vérifiés pendant le dev)

- **Zéro erreur/warning dans la console Chrome**, sinon c'est éliminatoire. Après chaque modif, ouvre la console sur les pages touchées, en `dev` **et** après `bun run build && bun run start`.
- **Hydratation** : pas de `Date.now()`, `Math.random()`, `window` ou `localStorage` pendant le rendu. Ils vont dans un `useEffect` ou un gestionnaire d'événement (c'est le cas dans le Pong).
- **Dates** : le fuseau est fixé à `Europe/Paris` dans `i18n/request.ts`, pour que serveur et client formatent pareil. Formate avec `getFormatter()` / `useFormatter()` de next-intl.
- **Next.js 16 ≠ les tutos en ligne** : `middleware.ts` s'appelle maintenant `proxy.ts`, `params` est une `Promise` (il faut `await params`). En cas de doute, lis `node_modules/next/dist/docs/`.
- `.next/` n'est plus suivi par Git (il l'était par erreur). Ne le re-commite pas.
- `PageProps<"/[locale]/...">` et `LayoutProps<...>` sont des types globaux générés par Next. Si TypeScript ne les trouve pas : `bunx next typegen`.

## 11. Ce qui a été vérifié

- `bunx tsc --noEmit`, `bun run lint`, `bun run build` : OK, 21 pages pré-rendues (EN + FR).
- Test automatisé dans **Chrome** (prod et dev) sur toutes les pages : **aucune erreur ni warning console**. Le seul message est le 404 d'une URL inexistante visitée exprès.
- Erreurs de validation affichées et traduites (FR) ; message « backend pas branché » sur un formulaire valide.
- Changement de langue EN → FR qui reste sur la même page.
- Pong : lancement, score, pause.
- Rendu mobile (390 px) vérifié sur l'inscription.

## 12. Prochaines étapes suggérées

| Qui | Quoi |
|---|---|
| Front | Choisir la 3e langue ; style / identité visuelle ; menu mobile ; test Firefox + Edge (module « navigateurs ») |
| Auth & users | Upload d'avatar, modification du profil ; créer l'app 42 sur l'intra |
| DevOps | Monitoring Prometheus + Grafana ; schéma de BDD dans le README |
| Moteur | Boucle serveur + Socket.IO, réutiliser la logique de `local-pong.tsx` ; reconnexion ; spectateur |
| Autour du jeu | Activer les modes IA / tournoi dans `app/[locale]/play/page.tsx` (`href: null` → vraie route) |
