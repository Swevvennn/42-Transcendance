// Static sample data for the UI preview. To be replaced by Prisma queries.

export type UserStatus = "online" | "offline" | "inGame"

export const currentUser = {
  username: "player42",
  level: 7,
  status: "online" as UserStatus,
  wins: 24,
  losses: 11,
}

export const matchHistory = [
  { id: 1, opponent: "alice", myScore: 5, theirScore: 3, date: "2026-10-30T18:12:00Z" },
  { id: 2, opponent: "carol", myScore: 2, theirScore: 5, date: "2026-10-29T20:45:00Z" },
  { id: 3, opponent: "bob", myScore: 5, theirScore: 4, date: "2026-10-28T14:03:00Z" },
]

export const friends: { username: string; status: UserStatus }[] = [
  { username: "alice", status: "online" },
  { username: "bob", status: "inGame" },
  { username: "dave", status: "offline" },
]

export const leaderboard = [
  { username: "alice", wins: 31, losses: 6, level: 9 },
  { username: "player42", wins: 24, losses: 11, level: 7 },
  { username: "bob", wins: 19, losses: 14, level: 6 },
  { username: "dave", wins: 8, losses: 20, level: 3 },
]
