import {
  GlobeHemisphereWestIcon,
  RobotIcon,
  TrophyIcon,
} from "@phosphor-icons/react/ssr"

// The three selling points shown on every landing page (texts in Home.features).
export const landingFeatures = [
  { key: "online", Icon: GlobeHemisphereWestIcon },
  { key: "ai", Icon: RobotIcon },
  { key: "tournament", Icon: TrophyIcon },
] as const
