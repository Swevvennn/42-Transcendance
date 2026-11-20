import { hashPassword } from "better-auth/crypto";

import { prisma } from "../lib/prisma";

// Mot de passe commun aux comptes de test (respecte les regles du formulaire :
// 8 caracteres minimum, au moins une lettre et un chiffre).
const SEED_PASSWORD = "Password123";

async function main() {
  // 0. Garde-fou : le seed ne doit jamais tourner sur la vraie base.
  //    Pour forcer quand meme (ex : base Docker de test) : ALLOW_SEED=1
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "1") {
    console.error("Seed refusé : NODE_ENV=production. Relance avec ALLOW_SEED=1 si c'est une base de test.");
    process.exit(1);
  }

  // 1. Création de 3 joueurs de test (avec XP et niveaux différents)
  const alice = await prisma.user.upsert({
    where: { email: "alice@42.fr" },
    update: {},
    create: {
      id: "seed-user-alice",
      name: "Alice",
      email: "alice@42.fr",
      emailVerified: true,
      username: "alice",
      displayUsername: "Alice",
      xp: 450,
      level: 5,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@42.fr" },
    update: {},
    create: {
      id: "seed-user-bob",
      name: "Bob",
      email: "bob@42.fr",
      emailVerified: true,
      username: "bob",
      displayUsername: "Bob",
      xp: 220,
      level: 3,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@42.fr" },
    update: {},
    create: {
      id: "seed-user-charlie",
      name: "Charlie",
      email: "charlie@42.fr",
      emailVerified: true,
      username: "charlie",
      displayUsername: "Charlie",
      xp: 80,
      level: 1,
    },
  });

  // 1b. Un compte "credential" (email + mot de passe) par joueur, sinon
  //     impossible de se connecter avec. C'est la table account de Better Auth :
  //     - providerId "credential" = connexion par mot de passe (vs "42")
  //     - accountId = l'id du user pour ce type de compte
  //     - password = le hash scrypt, fait avec la MEME fonction que Better Auth
  //       (better-auth/crypto), donc le login sait le verifier.
  const password = await hashPassword(SEED_PASSWORD);
  for (const user of [alice, bob, charlie]) {
    await prisma.account.upsert({
      where: { id: `seed-account-${user.username}` },
      update: { password },
      create: {
        id: `seed-account-${user.username}`,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password,
      },
    });
  }

  // 2. Création de relations d'amitié (1 acceptée, 1 en attente)
  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: alice.id,
        addresseeId: bob.id,
      },
    },
    update: {},
    create: {
      requesterId: alice.id,
      addresseeId: bob.id,
      status: "accepted",
    },
  });

  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: charlie.id,
        addresseeId: alice.id,
      },
    },
    update: {},
    create: {
      requesterId: charlie.id,
      addresseeId: alice.id,
      status: "pending",
    },
  });

  // 3. Création d'un historique de matchs (uniquement si la table est vide)
  const existingMatches = await prisma.match.count();
  if (existingMatches === 0) {
    await prisma.match.createMany({
      data: [
        {
          player1Id: alice.id,
          player2Id: bob.id,
          vsAI: false,
          score1: 5,
          score2: 3,
          winnerId: alice.id,
          endedAt: new Date(),
        },
        {
          player1Id: bob.id,
          player2Id: charlie.id,
          vsAI: false,
          score1: 5,
          score2: 1,
          winnerId: bob.id,
          endedAt: new Date(),
        },
        {
          player1Id: alice.id,
          player2Id: null,
          vsAI: true,
          score1: 5,
          score2: 2,
          winnerId: alice.id,
          endedAt: new Date(),
        },
      ],
    });
  }

  console.log("Seed terminé : 3 joueurs, 2 amitiés et 3 matchs insérés.");
  console.log(`Connexion : alice@42.fr, bob@42.fr ou charlie@42.fr / ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Erreur pendant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });