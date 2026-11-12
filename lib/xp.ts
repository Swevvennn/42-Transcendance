// XP and levels, given at the end of each online match (server/results.ts).

export const XP_WIN = 100
export const XP_LOSS = 25
/** XP needed for each level: level 2 at 250 XP, level 3 at 500… */
export const XP_PER_LEVEL = 250

export const levelFor = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1
