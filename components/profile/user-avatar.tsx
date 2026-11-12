import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/** Avatar picture (42 photo) or the first two letters of the name. */
export function UserAvatar({
  name,
  image,
  size,
}: {
  name: string
  image?: string | null
  size?: "default" | "sm" | "lg"
}) {
  return (
    <Avatar size={size}>
      {image && <AvatarImage src={image} alt="" />}
      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}
