FROM oven/bun:1 AS builder
#dis qu'on utilisera un linux nommer oven/bun ou bun est deja dl

WORKDIR /app

#package.json + bun.lock pour installer, et le schema prisma car `bun install`
#lance `prisma generate` (script postinstall) qui en a besoin
COPY package.json bun.lock prisma.config.ts /app/
COPY prisma /app/prisma

#va lire bun.lock et installer les infos contenus dedans
RUN bun install

#Copie tout le reste du code, 1er point = tt ce qui est ds le dossier 2e = ds le dossier de travail du conteneur donc /app
COPY . .

#compile le typescript, navigateur et serveur node.js comprennent pas le ts brut build va tt traduire en javascript
RUN bun run build

#cmd qd le conteneur se start a chaque lancement :
#1. applique les migrations prisma (cree / met a jour les tables de la bdd)
#2. lance server.ts (Next.js + Socket.IO) en production
CMD ["sh", "-c", "bun run db:deploy && bun run start"]
