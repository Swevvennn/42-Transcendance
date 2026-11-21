import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/**
 * Avatar picture (uploaded or 42 photo). Default avatar when there is none:
 * the first two letters of the name.
 */
export function UserAvatar({
  name,
  image,
  size,
  className,
}: {
  name: string
  image?: string | null
  size?: "default" | "sm" | "lg"
  className?: string
}) {
  return (
    <Avatar size={size} className={className}>
      {image && <AvatarImage src={image} alt="" />}
      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}
