export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  source: {
    label: string;
    url: string;
  };
  reviewedOn: string;
}

export const knowledgeEntries = [
  {
    id: 'earth-atmosphere-composition',
    title: "Earth's atmosphere",
    summary:
      "Earth's dry atmosphere is about 78% nitrogen and 21% oxygen, with the remainder made up of argon, carbon dioxide, and other gases.",
    source: {
      label: 'NASA Science — Earth Facts',
      url: 'https://science.nasa.gov/earth/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'moon-synchronous-rotation',
    title: "The Moon's synchronous rotation",
    summary:
      'The Moon rotates once in about the same time that it orbits Earth, so nearly the same lunar hemisphere faces Earth throughout each orbit.',
    source: {
      label: 'NASA Science — Moon Facts',
      url: 'https://science.nasa.gov/moon/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'mars-day-length',
    title: 'The length of a Martian day',
    summary:
      'A solar day on Mars, often called a sol, lasts about 24 hours and 39 minutes—only a little longer than a day on Earth.',
    source: {
      label: 'NASA Science — Mars Facts',
      url: 'https://science.nasa.gov/mars/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'sun-system-mass',
    title: "The Sun's share of solar-system mass",
    summary:
      'The Sun contains about 99.8% of the mass in our solar system, which is why its gravity dominates the orbits of the planets.',
    source: {
      label: 'NASA Science — Sun Facts',
      url: 'https://science.nasa.gov/sun/facts/',
    },
    reviewedOn: '2026-08-01',
  },
] as const satisfies readonly KnowledgeEntry[];

export const knowledgeById: ReadonlyMap<string, KnowledgeEntry> = new Map(
  knowledgeEntries.map((entry) => [entry.id, entry]),
);
