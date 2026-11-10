FROM oven/bun:1 AS builder
#dis qu'on utilisera un linux nommer oven/bun ou bun est deja dl

WORKDIR /app

COPY package.json bun.lock /app/

#va lire bun.lock et installer les infos contenus dedans
RUN bun install

#Copie tout le reste du code, 1er point = tt ce qui est ds le dossier 2e = ds le dossier de travail du conteneur donc /app
COPY . .

#compile le typescript, navigateur et serveur node.js comprennent pas le ts brut build va tt traduire en javascript
RUN bun run build

#cmd qd le conteneur se start a chaque lancement. bun = executable equivalant cc/gcc
CMD ["bun", "run", "start"]