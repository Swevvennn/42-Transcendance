# Git workflow — bringing everyone's branches together

> Written on 6 November 2026. Situation at that date: GitHub (`origin`) only has
> `main` (commit `5f6b969`, the front-end rebuild) and `feat/style-templates`
> (mosmond's theme, Stack logo, home intro, `/templates` lab). Teammates started
> their own branches from `main` on their machines but had **not pushed them yet**.

## The main risk

`5f6b969` rebuilt the front-end from scratch and **deleted the old front**
(battleship theme, sidebar). A branch created *before* that commit still
contains the old front: merging it as is would bring the deleted files back.

## Steps

### 1. Everyone pushes their branch as it is (backup, harmless)

```bash
git push -u origin <your-branch>
```

### 2. Protect `main` on GitHub

Settings → Branches → add a rule for `main`: **Require a pull request before
merging**. Nothing reaches `main` except through a reviewed PR, and no one can
force-push it.

### 3. Each person checks where their branch started

```bash
git fetch origin
git merge-base --is-ancestor 5f6b969 HEAD && echo "based on the new front" || echo "based on the OLD front"
```

### 4a. Based on the new front → merge `main` into your branch

```bash
git branch backup/<your-branch>   # safety copy first
git merge origin/main             # merge, not rebase (safer on shared branches)
# fix conflicts, then check everything still works:
bun install && bunx tsc --noEmit && bun run lint && bun run build
git push
```

Then open a PR into `main`.

### 4b. Based on the OLD front → move only your own commits

Don't merge it. Recreate the branch from the current `main` and copy only
your own commits onto it:

```bash
git switch -c <your-branch>-v2 origin/main
git log --oneline <your-branch>       # find your own commits
git cherry-pick <commit1> <commit2>   # oldest first
git push -u origin <your-branch>-v2
```

### 5. Merge the PRs one at a time

After each merge into `main`, the next person runs `git merge origin/main`
again on their branch before their PR is merged. Conflicts stay small and are
fixed by whoever knows that code.

## Where conflicts usually come from

| File | What to do |
|---|---|
| `bun.lock` | **Never fix by hand.** Settle `package.json` first, then `bun install` (it rewrites the lockfile), then `git add bun.lock`. |
| `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` | Delete them: the project uses **bun** only. |
| `messages/en.json`, `messages/fr.json` | Keep both sides' keys; both files must have the same keys. |
| `package.json`, `app/[locale]/layout.tsx`, `app/globals.css`, `.gitignore` | Shared config: keep both changes, then run the checks. |

Backend work (Prisma, Docker, auth) mostly touches different files from the
front, so few conflicts are expected there.

## Rules for everyone

- Never `git push --force` on `main`. On your own branch, if you really must,
  use `git push --force-with-lease`.
- Make a safety copy (`git branch backup/...`) before any risky operation
  (merge, rebase, cherry-pick, reset).
- Never commit `.env*` (ignored by `.gitignore`); commit `.env.example` instead.
- Before pushing: `bunx tsc --noEmit`, `bun run lint`, `bun run build`.
- Before merging into `main`: check the Chrome console on the pages you touched,
  in `bun run dev` and after `bun run build && bun run start` (zero errors is
  required at evaluation).

## Pending (as of 6 November 2026)

- [ ] Teammates push their branches.
- [ ] Protect `main` on GitHub.
- [ ] Trial merge of each branch on a temporary local branch (nothing pushed) to
      see the exact conflicts and spot branches based on the old front.
      Claude can do this once the branches are on GitHub.
- [ ] Check the Chrome console on `/`, then merge `feat/style-templates` through a PR:
      https://github.com/Swevvennn/42-Transcendance/pull/new/feat/style-templates
- [ ] Optional cleanup: the local `master` branch is stale (deleted on GitHub):
      `git branch -D master`.
