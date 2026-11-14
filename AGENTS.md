<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules for coding agents

The block above is managed by `next dev`, so don't edit it. Everything below is ours. Project context (subject, modules, owners) is in `CLAUDE.md`. Detailed front-end notes, in French, are in `docs/frontend.md`.

## Tooling

- Local Node is too old for some CLIs: run them through bun (`bunx --bun <bin>`, `bun run --bun lint`).

- Use **bun** only: `bun install`, `bun add <pkg>`, `bun run <script>`, `bunx <bin>`. Do not use npm/pnpm/yarn, and do not commit another lockfile.
- Before handing work back, run and pass all of these: `bunx tsc --noEmit`, `bun run lint`, `bun run build`.
- If `PageProps` / `LayoutProps` types are missing: `bunx next typegen`.
- Never commit `.next/` or `.env*`.

## Next.js 16 specifics used here

- Middleware is now **`proxy.ts`** (root). It runs the next-intl locale redirect.
- `params` is a **Promise**: `const { locale } = await params`.
- Page/layout props use the global helpers `PageProps<"/[locale]/route">` and `LayoutProps<"/[locale]">`.

## Structure and conventions

- All routes live under **`app/[locale]/`**. A new page must:
  1. be an async server component that does `const { locale } = await params; setRequestLocale(locale as Locale)`;
  2. get text with `await getTranslations("Namespace")`;
  3. export `generateMetadata` with a translated `title`.
  Copy `app/[locale]/leaderboard/page.tsx` as a template.
- Only use `"use client"` where needed (state, effects, events, canvas). Keep pages as server components and move interactive parts into `components/`.
- **Internal links**: import `Link`, `useRouter`, `usePathname` and `redirect` from **`@/i18n/navigation`**, never from `next/link` / `next/navigation`. Use `notFound` from `next/navigation`.
- **Button-looking links**: use `<ButtonLink>` from `@/components/button-link`. Do not put `className={buttonVariants()}` directly on a link: without `cn()`, conflicting classes are not merged (that bug removed outline borders before).
- **shadcn**: add components with `bunx shadcn@latest add <name>`. They are base-ui based (not Radix): composition uses the `render` prop, not `asChild`. Generated files import `cn` from the `cn` package, and `@/lib/utils` re-exports it. Icons are Phosphor: use `@phosphor-icons/react/ssr` in server components and `@phosphor-icons/react` in client components.
- Styling: Tailwind classes and the shadcn theme tokens (`bg-background`, `text-muted-foreground`…). Don't hard-code colors.

## i18n (next-intl) — mandatory

- Every user-visible string, including errors, aria-labels and metadata, comes from `messages/<locale>.json`. Don't hard-code text in JSX.
- Add every key to **all** files in `messages/` with identical structure. TypeScript only checks keys against `en.json`.
- Locales are listed in `i18n/routing.ts`. The time zone is fixed in `i18n/request.ts` (`Europe/Paris`). Format dates and numbers with next-intl's `getFormatter` / `useFormatter`.

## Forms and validation

- Validation schemas live in `lib/validation/` (zod) and are shared by client and server. The server must re-validate with the same schema.
- Zod error messages are translation keys under `Validation.*`. Keep the `ValidationKey` type in sync.
- Forms use `noValidate`, shadcn `Field` / `FieldError`, and the `useFormErrors` hook (`components/auth/use-form-errors.ts`).

## Zero console errors (evaluation is eliminatory)

- Nothing non-deterministic during render: no `Date.now()`, `Math.random()`, `window`, `document` or `localStorage`. Put them in effects or event handlers.
- Check Chrome DevTools console on every touched page, in `bun run dev` and after `bun run build && bun run start`.

## Data and backend status

- Database reads for pages are in `lib/users.ts` (profile, stats, history, leaderboard, friends); friend mutations are server actions in `lib/actions/friends.ts` (validated with `lib/validation/friends.ts`). Profile edits and avatar upload/removal are server actions in `lib/actions/profile.ts` (validated with `lib/validation/profile.ts`); avatars are stored in the `avatar` table and served by `app/api/avatar/[id]/route.ts`. Online status comes from the game server through `lib/presence.ts`.
- Auth: Better Auth (`lib/auth.ts` server, `lib/auth-client.ts` browser, API at `app/api/auth/[...all]/route.ts`), email + password + unique `username`, TOTP 2FA (`twoFactor` plugin; the login form handles the code step), "Continue with 42" (`genericOAuth`, only enabled when `FT_CLIENT_ID` / `FT_CLIENT_SECRET` are set; see `lib/oauth42.ts`). Every Better Auth route that takes user input is re-validated with our zod schemas (`validatedRoutes` in `lib/auth.ts`). Database: Prisma 7 (`prisma/schema.prisma`, client generated in `lib/generated/prisma`, import `prisma` from `@/lib/prisma`). Do not upgrade to Prisma 8 (RC, incompatible with Better Auth). Details in French: `docs/auth.md`.
- Pong physics live in `lib/pong/engine.ts`, shared by the local game (`components/pong/local-pong.tsx`) and the server.
- Online play is server-authoritative: `server.ts` (custom server, Next + Socket.IO on one port) → `server/game-server.ts` (queue, matches, tournaments, in memory) → `server/match.ts` (60 ticks/s loop) / `server/tournament.ts` (bracket). Event types are in `lib/pong/protocol.ts`; the server re-validates every payload with `lib/validation/game.ts`. Client side: `lib/pong/connection.ts` + `components/online/`. Explanations in French: `docs/online.md`.
- `bun run dev` / `bun run start` run `server.ts` (not `next dev` / `next start`). Online play requires a logged-in user: the socket server reads the Better Auth session from the cookie. Finished matches are saved by `server/results.ts` (history, stats, XP / level in `lib/xp.ts`). The header (`components/user-menu.tsx`) opens the game connection on every page while logged in, so friends see you online.

## Deployment

- The front-end preview is deployed on **Vercel** (detects bun via `bun.lock`). Vercel cannot run the planned custom `server.ts` / Socket.IO or keep WebSockets open. Real-time features must not rely on Vercel.
- The evaluation setup is Docker Compose + nginx HTTPS (see `CLAUDE.md`). Production runs `next build`, never `next dev`.
