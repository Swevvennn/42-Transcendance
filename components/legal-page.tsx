// Shared layout for the Privacy Policy and Terms of Service pages.
export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string
  updated: string
  sections: { key: string; title: string; body: string }[]
}) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-xs text-muted-foreground">{updated}</p>
      </header>
      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-2">
          <h2 className="font-semibold">{section.title}</h2>
          <p className="text-sm leading-relaxed">{section.body}</p>
        </section>
      ))}
    </article>
  )
}
