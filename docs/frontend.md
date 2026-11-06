# Front — ce qui a été fait et comment continuer

> Rédigé le 2 novembre 2026, après la refonte du front (preview). Mis à jour le 6 novembre 2026 (thème suisse clair/sombre, logo « Stack », intro animée de l'accueil, labo de styles : voir § 6 et § 9). Ce fichier est destiné à l'équipe : il explique ce qui existe, pourquoi c'est fait comme ça, et comment ajouter des choses sans casser ce qui marche.

## 1. Résumé

Le front a été **repris de zéro** pour coller au `CLAUDE.md` (Pong 2D, Next.js, Tailwind, next-intl). L'ancien front (thème « bataille navale », sidebar) a été supprimé. Three.js est revenu, mais **uniquement** pour l'intro animée de l'accueil (§ 9), chargé à la demande.

Ce qu'on a maintenant : une **preview fonctionnelle** de toutes les pages, volontairement **simple** côté style et contenu.

- Stack : Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui (variante base-ui) · next-intl · zod · three.js (intro de l'accueil)
- Gestionnaire de paquets : **bun** (plus pnpm)
- Langues : **EN / FR** (la 3e langue sera choisie plus tard)
- Déploiement de la preview : **Vercel** (voir § 10)
- Pas encore de backend : les formulaires valident côté client, les pages profil / classement utilisent des données d'exemple.

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
| `/` | `app/[locale]/page.tsx` | Accueil suisse (bloc logo, Pong « attract » jouable, 3 cartes) + intro animée (§ 9) | ✅ |
| `/login` | `app/[locale]/login/page.tsx` | Formulaire email + mot de passe, bouton « 42 » | Front OK, backend à brancher |
| `/signup` | `app/[locale]/signup/page.tsx` | Username, email, mot de passe, confirmation | Front OK, backend à brancher |
| `/play` | `app/[locale]/play/page.tsx` | Choix du mode (local, IA, en ligne, tournoi) | Seul « local » est jouable |
| `/play/local` | `app/[locale]/play/local/page.tsx` | Pong 1v1 sur le même clavier | ✅ (client uniquement) |
| `/profile` | `app/[locale]/profile/page.tsx` | Avatar, statut, niveau, stats, historique, amis | Données d'exemple |
| `/leaderboard` | `app/[locale]/leaderboard/page.tsx` | Classement | Données d'exemple |
| `/privacy` | `app/[locale]/privacy/page.tsx` | Politique de confidentialité | ✅ (obligatoire) |
| `/terms` | `app/[locale]/terms/page.tsx` | Conditions d'utilisation | ✅ (obligatoire) |
| 404 | `app/[locale]/not-found.tsx` + `app/[locale]/[...rest]/page.tsx` | Page introuvable traduite | ✅ |
| `/templates` | `app/[locale]/templates/` | Labo de styles : landings, animations, personnages 3D, logos (§ 6) | Outil interne |

Le header (`components/site-header.tsx`) contient le logo, la navigation, le sélecteur de langue et le bouton clair / sombre. Le footer (`components/site-footer.tsx`) contient les liens Privacy / Terms, **exigés par le sujet** (sinon le projet est rejeté).

## 4. Arborescence

```
app/
  globals.css               thème shadcn (variables CSS) + Tailwind
  landing-motion.css        animations de l'accueil et de l'intro (data-motion)
  templates.css             styles du labo /templates (.theme-*)
  icon.svg                  favicon : le logo « Stack »
  [locale]/                 toutes les pages sont sous la langue
    layout.tsx              <html>, polices, provider next-intl, header, footer
    page.tsx, login/, signup/, play/, play/local/, profile/,
    leaderboard/, privacy/, terms/, not-found.tsx, [...rest]/,
    templates/              labo de styles (+ motion/[variant], characters, [style])
components/
  ui/                       composants shadcn (générés, voir § 6)
  auth/                     formulaires login/signup + hook de validation
  pong/local-pong.tsx       le Pong local (canvas)
  brand/logos.tsx           les logos (« Stack » = le logo retenu, § 6)
  landing/                  page d'accueil (landing.tsx), Pong « attract »,
    anime3d/                intro 3D (three.js) : engine, rig, kit, intro, lab
  templates/                composants du labo /templates
  page-header.tsx           gros titre de page + point rouge
  theme-toggle.tsx, inline-script.tsx   clair / sombre sans flash
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
  theme.ts                  script de thème clair / sombre (localStorage + OS)
  validation/auth.ts        schémas zod partagés front/back
  mock-data.ts              données d'exemple (à remplacer par Prisma)
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
- **Thème « Suisse »** (style typographique international) : noir, blanc et un seul rouge (`--primary`), coins carrés (`--radius: 0`), police **Inter Tight**. Les variables sont dans `:root` (clair) et `.dark` (sombre) de `globals.css`. `--border` reste discret (tableaux, champs) ; pour les gros filets suisses, utiliser `border-2 border-foreground`.
- Titres de page : `<PageHeader>` (`components/page-header.tsx`) donne le gros titre serré avec le point rouge et le filet dessous.
- **Clair / sombre** : bouton `<ThemeToggle>` dans le header. Le choix est gardé dans `localStorage` (clé `theme`), sinon on suit le réglage de l'OS. Un script inline dans le `<head>` (`lib/theme.ts` + `components/inline-script.tsx`) pose la classe `dark` sur `<html>` **avant le premier affichage** : pas de flash ni d'erreur d'hydratation (guide Next « preventing flash before hydration »). Pas de `next-themes` : il provoque un warning React 19 sur les balises `<script>`.
- **Logo : « Stack »** (choix définitif). Bloc carré couleur `foreground`, le nom sur deux lignes en capitales noires, la balle rouge en haut à droite. Composant `logos.stack` dans `components/brand/logos.tsx` (`Full` = bloc avec le nom, `Icon` = pictogramme carré). Utilisé pour le favicon (`app/icon.svg`), le header, l'écran de chargement et le titre de l'accueil. **Toujours utiliser celui-là** ; les autres logos du fichier sont des essais.
- **Labo de styles** : `/[locale]/templates`, outil interne (pas de lien dans le menu) :
  - essais de landing page (brutaliste, éditorial, terminal, suisse, riso, plan technique), chaque style est une classe `.theme-*` dans `app/templates.css` ;
  - **animations de l'accueil** (`/templates/motion/<variante>`, bouton « Rejouer ») : gym, rooftop, **manga** (celle de l'accueil), anime, kinetic, rally, assemble, attract. Liste dans `components/landing/motion.ts`, CSS dans `app/landing-motion.css` ;
  - **labo personnages** (`/templates/characters`) : les styles de modèle 3D (classic, sharp, lowpoly, chibi, ink), poses (prêt, coup droit, smash), vue visage, trame manga ;
  - les logos.

## 7. Formulaires et validation

Le sujet exige une **validation côté front ET côté back**.

- Les règles sont dans `lib/validation/auth.ts` (zod) : `loginSchema` et `signupSchema`. **Le backend doit réutiliser ces mêmes schémas** pour valider les données reçues.
- Les messages d'erreur zod sont des **clés de traduction** (`usernameLength`, `emailInvalid`…) traduites dans le namespace `Validation`. Pour ajouter une règle : ajouter le message dans le schéma, dans le type `ValidationKey`, et dans `Validation` de chaque fichier de messages.
- `components/auth/use-form-errors.ts` exécute le schéma et garde la première erreur par champ.
- Les formulaires ont `noValidate` : on désactive les bulles natives du navigateur (qui seraient dans la langue du navigateur et non celle du site) au profit de nos messages traduits.
- **À faire (Auth)** : remplacer les `TODO` dans `login-form.tsx` / `signup-form.tsx` par l'appel à Better Auth, puis afficher les erreurs serveur. Le bouton « Continuer avec 42 » est désactivé en attendant l'OAuth.

## 8. Le Pong local

`components/pong/local-pong.tsx` est un composant client (`"use client"`) qui dessine sur un `<canvas>` :

- terrain logique de 800 × 500, mis à l'échelle en CSS ;
- W/S pour le joueur gauche, ↑/↓ pour le droit, Espace pour lancer / pause / rejouer ; premier à 5 ;
- physique en sous-pas de 1/240 s pour que la balle rapide ne traverse pas les raquettes ;
- angle de rebond selon l'endroit où la balle touche la raquette, vitesse +5 % par touche (plafonnée) ;
- la partie se met en pause si la fenêtre perd le focus ;
- les couleurs viennent du thème : raquettes et filet en `text-foreground`, balle en `--primary` (rouge), lues avec `getComputedStyle` à chaque frame, donc le canvas suit le passage clair / sombre.

**Important pour l'équipe Moteur** : ce Pong tourne **entièrement dans le navigateur**. C'est une preview. Pour le mode en ligne, le `CLAUDE.md` prévoit une boucle **côté serveur** (~60 ticks/s, Socket.IO) : le client enverra seulement haut/bas et dessinera l'état reçu. Les constantes et la logique de `update()` peuvent servir de base au moteur serveur ; `draw()` peut servir de base au rendu client.

## 9. L'intro animée de l'accueil

L'accueil (`<Landing motion="manga" introOnce />`) joue une intro façon manga en 3D cel-shading : deux lycéens jouent un échange, le héros saute pour un smash au ralenti (arrêt sur image), la balle part dans le ciel, retombe sur la caméra et finit dans le point rouge du logo.

- **Fichiers** : `components/landing/anime3d/` — `intro.tsx` (écran de chargement, overlay 2D : lignes de vitesse, flash, onomatopée, fin), `engine.ts` (scène, trajectoire de la balle, caméras par plan, chronologie `CUT`), `rig.ts` (personnages, coups `swingPose`, expressions du visage `heroMood` / `rivalMood`), `kit.ts` (matériaux cel-shading, contours, passe de trame manga), `lab.ts` (labo personnages).
- **Première visite de la session** : écran de chargement puis l'intro complète (bouton « Passer » pendant l'intro seulement). **Rechargements suivants** (`sessionStorage`, clé `landing-intro-seen`) : seulement l'écran de chargement, puis la balle rouge du logo va au centre de l'écran et tombe dans le logo de la page. three.js n'est alors pas chargé. Les previews de `/templates/motion/*` jouent toujours l'intro complète.
- **three.js est chargé à la demande** (`import("./engine")`) pendant l'écran de chargement : il ne pèse pas sur les autres pages.
- **Mode sombre** : l'intro est **la même que la version claire, juste assombrie**. Les couleurs claires sont lues via une sonde `.light` (`:root, .light` dans `globals.css`) et les canvas reçoivent `filter: brightness(0.6)` sous `.dark` (`app/landing-motion.css`). Ne pas « inverser » les couleurs en sombre.
- **Accessibilité** : avec `prefers-reduced-motion: reduce`, pas d'intro du tout, la page s'affiche directement.
- **Réglages utiles** : tempo global `TEMPO` (`intro.tsx`), chronologie `CUT` / `SPEED` (`engine.ts`, garder `SCENE_END` de `intro.tsx` égal à `CUT.end`), durée de la chute `DROP_MS`, luminosité en sombre (`brightness` dans `landing-motion.css`), ombres du visage `SKIN_LIFT` (`kit.ts`), angle du smash `FACE` / `WRIST` (`rig.ts`).
- **Vérifier la géométrie** : pour un problème du genre « la raquette traverse la balle », on peut importer `rig.ts` / `engine.ts` dans un petit script `bun` (sans navigateur) et mesurer distances et angles ; c'est comme ça que les réglages actuels ont été trouvés (aucune intersection raquette / balle autour du smash).

## 10. Déploiement Vercel

La preview du site est déployée sur **Vercel**.

- Vercel détecte **bun** grâce à `bun.lock`. Si le projet Vercel avait une *Install Command* forcée sur `pnpm install` dans ses réglages, **il faut la retirer** : `pnpm-lock.yaml` n'existe plus.
- Le `proxy.ts` (redirection de langue) et les pages pré-rendues fonctionnent sur Vercel sans configuration.
- ⚠️ **Limites de Vercel à connaître :**
  - Vercel ne fait pas tourner de **custom server** (`server.ts`) ni de **WebSocket persistant**. Le temps réel Socket.IO (parties en ligne, statut en ligne, spectateur) **ne marchera pas sur Vercel**. Il faudra soit l'héberger ailleurs, soit se contenter de Vercel pour la preview du front.
  - Le sujet exige pour l'évaluation un lancement **Docker en une commande** avec **HTTPS** : Vercel ne remplace pas `docker-compose` + nginx. Il sert à montrer le front, pas pour l'éval.

## 11. Pièges à éviter (vérifiés pendant le dev)

- **Zéro erreur/warning dans la console Chrome**, sinon c'est éliminatoire. Après chaque modif, ouvre la console sur les pages touchées, en `dev` **et** après `bun run build && bun run start`.
- **Hydratation** : pas de `Date.now()`, `Math.random()`, `window` ou `localStorage` pendant le rendu. Ils vont dans un `useEffect` ou un gestionnaire d'événement (c'est le cas dans le Pong).
- **Dates** : le fuseau est fixé à `Europe/Paris` dans `i18n/request.ts`, pour que serveur et client formatent pareil. Formate avec `getFormatter()` / `useFormatter()` de next-intl.
- **Next.js 16 ≠ les tutos en ligne** : `middleware.ts` s'appelle maintenant `proxy.ts`, `params` est une `Promise` (il faut `await params`). En cas de doute, lis `node_modules/next/dist/docs/`.
- `.next/` n'est plus suivi par Git (il l'était par erreur). Ne le re-commite pas.
- `PageProps<"/[locale]/...">` et `LayoutProps<...>` sont des types globaux générés par Next. Si TypeScript ne les trouve pas : `bunx next typegen`.

## 12. Ce qui a été vérifié

- `bunx tsc --noEmit`, `bun run lint`, `bun run build` : OK, 21 pages pré-rendues (EN + FR).
- Test automatisé dans **Chrome** (prod et dev) sur toutes les pages : **aucune erreur ni warning console**. Le seul message est le 404 d'une URL inexistante visitée exprès.
- Erreurs de validation affichées et traduites (FR) ; message « backend pas branché » sur un formulaire valide.
- Changement de langue EN → FR qui reste sur la même page.
- Pong : lancement, score, pause.
- Rendu mobile (390 px) vérifié sur l'inscription.
- 6 novembre 2026 (thème, logo, intro) : `tsc`, `lint`, `build` OK (53 pages pré-rendues). Géométrie de l'intro vérifiée par script. **Pas encore revérifié dans Chrome** (console à zéro erreur, dev et prod) : à faire avant de merger dans `main`.

## 13. Prochaines étapes suggérées

| Qui | Quoi |
|---|---|
| Front | Choisir la 3e langue ; menu mobile ; test Firefox + Edge (module « navigateurs », intro WebGL comprise) ; console Chrome sur l'accueil (intro) |
| Auth & users | Better Auth → brancher les formulaires, OAuth 42, 2FA ; vraie page profil (avatar, amis) |
| DevOps | Prisma + PostgreSQL → remplacer `lib/mock-data.ts` ; Docker + nginx HTTPS ; `.env.example` |
| Moteur | Boucle serveur + Socket.IO, réutiliser la logique de `local-pong.tsx` ; reconnexion ; spectateur |
| Autour du jeu | Activer les modes IA / tournoi dans `app/[locale]/play/page.tsx` (`href: null` → vraie route) |
