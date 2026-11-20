# --- ETAPE 1 : Le chantier de compilation ---
FROM oven/bun:1 AS builder
#dis qu'on utilisera un linux nommer oven/bun ou bun est deja dl

WORKDIR /app

# Copie des fichiers de dépendances et du schéma Prisma avant l'installation
COPY package.json bun.lock prisma.config.ts /app/
COPY prisma /app/prisma

#va lire bun.lock et installer exactement les versions qui y sont ecrites.
#--frozen-lockfile : si bun.lock ne correspond pas a package.json, on echoue
#au lieu de le modifier en silence (meme versions partout : PC, CI, Docker)
RUN bun install --frozen-lockfile

#Copie tout le reste du code, 1er point = tt ce qui est ds le dossier 2e = ds le dossier de travail du conteneur donc /app
COPY . .

#compile le typescript, navigateur et serveur next.js comprennent pas le ts brut build va tt traduire en javascript
#Le build lit ces variables mais ne se connecte pas a la base : on met des
#valeurs factices. Elles sont donnees a cette seule commande (pas d'ENV) :
#elles ne restent pas dans l'image, et Docker n'affiche pas d'alerte
#"secret dans un ENV". Les vraies valeurs arrivent au lancement (docker-compose).
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
    BETTER_AUTH_SECRET="build-only-dummy-secret-not-used-at-runtime" \
    BETTER_AUTH_URL="http://localhost:3000" \
    bun run build

# --- ÉTAPE 2 : L'image finale légère de production ---
FROM oven/bun:1-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# On récupère uniquement le nécessaire depuis le builder, en donnant les droits à l'utilisateur 'bun'
COPY --from=builder --chown=bun:bun /app/package.json /app/prisma.config.ts ./
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/.next ./.next
COPY --from=builder --chown=bun:bun /app/prisma ./prisma
COPY --from=builder --chown=bun:bun /app/server.ts /app/next.config.ts /app/tsconfig.json ./
COPY --from=builder --chown=bun:bun /app/server ./server
COPY --from=builder --chown=bun:bun /app/lib ./lib
# Traductions : lues par next-intl (i18n/request.ts) au moment de servir les pages
COPY --from=builder --chown=bun:bun /app/messages ./messages
COPY --from=builder --chown=bun:bun /app/i18n ./i18n

# Sécurité : on quitte root pour tourner avec un utilisateur standard
USER bun

EXPOSE 3000
#cmd qd le conteneur se start a chaque lancement :
#1. applique les migrations prisma (cree / met a jour les tables de la bdd)
#2. lance server.ts (Next.js + Socket.IO) en production
#exec : sh se REMPLACE par bun (comme execve() en C) au lieu de le lancer en
#fils. bun devient le PID 1 et recoit directement le SIGTERM de `docker stop`,
#donc il s'arrete proprement au lieu d'etre tue au bout de 10 s.
CMD ["sh", "-c", "bun run db:deploy && exec bun run start"]
