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
    id: 'mercury-smallest-fastest',
    title: 'Mercury: smallest and fastest planet',
    summary:
      'Mercury is the smallest planet and the closest planet to the Sun; it completes one orbit in just 88 Earth days.',
    source: {
      label: 'NASA Science — Mercury Facts',
      url: 'https://science.nasa.gov/mercury/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'venus-runaway-greenhouse',
    title: "Venus's runaway greenhouse effect",
    summary:
      "Venus is the hottest planet because its thick carbon-dioxide atmosphere traps heat in a runaway greenhouse effect—even though Mercury is closer to the Sun.",
    source: {
      label: 'NASA Science — Venus Facts',
      url: 'https://science.nasa.gov/venus/venus-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'jupiter-largest-fast-rotation',
    title: "Jupiter's size and short day",
    summary:
      'Jupiter is the largest planet in our solar system, yet it rotates in about 9.9 hours—the shortest day of any planet.',
    source: {
      label: 'NASA Science — Jupiter Facts',
      url: 'https://science.nasa.gov/jupiter/jupiter-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'saturn-ring-composition',
    title: "Saturn's rings",
    summary:
      "Saturn's rings contain billions of pieces of ice and rock coated with materials such as dust, ranging from tiny grains to much larger chunks.",
    source: {
      label: 'NASA Science — Saturn Facts',
      url: 'https://science.nasa.gov/saturn/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'uranus-sideways-rotation',
    title: "Uranus's extreme axial tilt",
    summary:
      'Uranus has an axial tilt of about 97.8 degrees, so it appears to rotate on its side as it orbits the Sun.',
    source: {
      label: 'NASA Science — Uranus Facts',
      url: 'https://science.nasa.gov/uranus/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'neptune-most-distant-planet',
    title: "Neptune's distant orbit",
    summary:
      'Neptune is the eighth and most distant planet from the Sun, and one Neptunian orbit lasts about 165 Earth years.',
    source: {
      label: 'NASA Science — Neptune Facts',
      url: 'https://science.nasa.gov/neptune/neptune-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'pluto-kuiper-belt-dwarf-planet',
    title: 'Pluto in the Kuiper Belt',
    summary:
      'Pluto is a dwarf planet in the Kuiper Belt, a distant region beyond Neptune populated by many icy worlds.',
    source: {
      label: 'NASA Science — Pluto Facts',
      url: 'https://science.nasa.gov/dwarf-planets/pluto/facts/',
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
