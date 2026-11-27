"use client"

// Inline <script> that runs during HTML parsing. On the client it is rendered
// as text/plain so React doesn't warn about script tags (Next.js guide:
// "preventing flash before hydration").
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
