<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules for coding agents

The block above is managed by `next dev`, so don't edit it. Everything below is ours. Project context (subject, modules, owners) is in `CLAUDE.md`. Detailed front-end notes, in French, are in `docs/frontend.md`.

## Tooling

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

- `lib/mock-data.ts` is placeholder data for the UI. Replace it with Prisma queries, don't extend it.
- The auth forms have `TODO`s where Better Auth calls go.
- `components/pong/local-pong.tsx` is a client-only local game. Online play must be server-authoritative (see `CLAUDE.md`).

## Deployment

- The front-end preview is deployed on **Vercel** (detects bun via `bun.lock`). Vercel cannot run the planned custom `server.ts` / Socket.IO or keep WebSockets open. Real-time features must not rely on Vercel.
- The evaluation setup is Docker Compose + nginx HTTPS (see `CLAUDE.md`). Production runs `next build`, never `next dev`.
