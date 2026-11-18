# --- ETAPE 1 : Le chantier de compilation ---
FROM oven/bun:1 AS builder
#dis qu'on utilisera un linux nommer oven/bun ou bun est deja dl

WORKDIR /app

# Copie des fichiers de dépendances et du schéma Prisma avant l'installation
COPY package.json bun.lock prisma.config.ts /app/
COPY prisma /app/prisma

#va lire bun.lock et installer les infos contenus dedans
RUN bun install

#Copie tout le reste du code, 1er point = tt ce qui est ds le dossier 2e = ds le dossier de travail du conteneur donc /app
COPY . .

#compile le typescript, navigateur et serveur next.js comprennent pas le ts brut build va tt traduire en javascript
RUN bun run build

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

# Sécurité : on quitte root pour tourner avec un utilisateur standard
USER bun

EXPOSE 3000
#cmd qd le conteneur se start a chaque lancement :
#1. applique les migrations prisma (cree / met a jour les tables de la bdd)
#2. lance server.ts (Next.js + Socket.IO) en production
CMD ["sh", "-c", "bun run db:deploy && bun run start"]
