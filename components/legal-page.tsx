import { PageHeader } from "@/components/page-header"

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
    <article className="flex flex-col gap-10">
      <PageHeader title={title} description={updated} />
      <div className="flex flex-col">
        {sections.map((section, index) => (
          <section
            key={section.key}
            className="grid gap-2 border-b border-border py-6 sm:grid-cols-12 sm:gap-4"
          >
            <span className="text-sm font-bold text-primary tabular-nums sm:col-span-1">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-lg leading-tight font-semibold sm:col-span-4">
              {section.title}
            </h2>
            <p className="max-w-prose text-sm leading-relaxed sm:col-span-7">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  )
}
