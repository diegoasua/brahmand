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
  {
    id: 'earth-surface-water',
    title: "Water on Earth's surface",
    summary:
      "About 71% of Earth's surface is covered by water, and the oceans hold most of that water.",
    source: {
      label: 'NASA Science — Earth Facts',
      url: 'https://science.nasa.gov/earth/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'earth-magnetosphere',
    title: "Earth's magnetic shield",
    summary:
      "Motion in Earth's molten metallic core helps generate a magnetic field, and the resulting magnetosphere deflects many charged particles from the solar wind.",
    source: {
      label: 'NASA Science — Earth Facts',
      url: 'https://science.nasa.gov/earth/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'moon-surface-gravity',
    title: "The Moon's surface gravity",
    summary:
      "Surface gravity on the Moon is about one-sixth of Earth's, so an object weighs much less there while keeping the same mass.",
    source: {
      label: 'NASA Science — Moon Facts',
      url: 'https://science.nasa.gov/moon/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'moon-exosphere-and-ice',
    title: 'The lunar exosphere and polar ice',
    summary:
      'The Moon has only a very thin exosphere rather than a substantial atmosphere, and permanently shadowed polar regions contain water ice.',
    source: {
      label: 'NASA Science — Moon Facts',
      url: 'https://science.nasa.gov/moon/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'mars-two-moons',
    title: "Mars's two moons",
    summary:
      'Mars has two small, irregularly shaped moons named Phobos and Deimos.',
    source: {
      label: 'NASA Science — Mars Facts',
      url: 'https://science.nasa.gov/mars/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'mars-olympus-mons',
    title: 'Olympus Mons',
    summary:
      'Mars is home to Olympus Mons, the largest known volcano in the solar system.',
    source: {
      label: 'NASA Science — Mars Facts',
      url: 'https://science.nasa.gov/mars/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'mercury-long-solar-day',
    title: "Mercury's long solar day",
    summary:
      'One complete day-night cycle on Mercury lasts 176 Earth days, even though Mercury circles the Sun in only 88 Earth days.',
    source: {
      label: 'NASA Science — Mercury Facts',
      url: 'https://science.nasa.gov/mercury/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'mercury-temperature-range',
    title: "Mercury's temperature extremes",
    summary:
      "Mercury's surface can reach about 430°C during the day and fall to about −180°C at night because it lacks a substantial heat-trapping atmosphere.",
    source: {
      label: 'NASA Science — Mercury Facts',
      url: 'https://science.nasa.gov/mercury/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'venus-retrograde-rotation',
    title: "Venus's backward rotation",
    summary:
      'Venus rotates in the opposite direction from most planets, and one rotation takes about 243 Earth days—longer than its 225-day orbit around the Sun.',
    source: {
      label: 'NASA Science — Venus Facts',
      url: 'https://science.nasa.gov/venus/venus-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'venus-surface-pressure',
    title: "Venus's crushing atmosphere",
    summary:
      "Atmospheric pressure at Venus's surface is more than 90 times Earth's surface pressure, and its clouds contain sulfuric acid.",
    source: {
      label: 'NASA Science — Venus Facts',
      url: 'https://science.nasa.gov/venus/venus-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'jupiter-composition',
    title: "Jupiter's composition",
    summary:
      'Jupiter is made mostly of hydrogen and helium and does not have a true solid surface beneath its deep atmosphere.',
    source: {
      label: 'NASA Science — Jupiter Facts',
      url: 'https://science.nasa.gov/jupiter/jupiter-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'jupiter-galilean-moons',
    title: "Jupiter's Galilean moons",
    summary:
      'The four large moons Io, Europa, Ganymede, and Callisto are called the Galilean moons after Galileo observed them in 1610.',
    source: {
      label: 'NASA Science — Jupiter Facts',
      url: 'https://science.nasa.gov/jupiter/jupiter-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'saturn-low-density',
    title: "Saturn's low average density",
    summary:
      'Saturn is the only planet with an average density lower than liquid water, although there is no ocean large enough to float it in.',
    source: {
      label: 'NASA Science — Saturn Facts',
      url: 'https://science.nasa.gov/saturn/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'saturn-titan',
    title: "Saturn's moon Titan",
    summary:
      'Titan is larger than Mercury and is the only moon known to have a dense atmosphere.',
    source: {
      label: 'NASA Science — Saturn Facts',
      url: 'https://science.nasa.gov/saturn/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'uranus-orbital-period',
    title: "Uranus's long year",
    summary:
      'Uranus takes about 84 Earth years to complete one orbit around the Sun.',
    source: {
      label: 'NASA Science — Uranus Facts',
      url: 'https://science.nasa.gov/uranus/uranus-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'uranus-ice-giant-atmosphere',
    title: 'Uranus as an ice giant',
    summary:
      "Uranus is an ice giant with an atmosphere made mostly of hydrogen and helium plus methane, which absorbs red light and contributes to the planet's blue-green color.",
    source: {
      label: 'NASA Science — Uranus Facts',
      url: 'https://science.nasa.gov/uranus/uranus-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'neptune-extreme-winds',
    title: "Neptune's extreme winds",
    summary:
      "Neptune is the solar system's windiest world, with atmospheric winds exceeding 2,000 kilometers per hour.",
    source: {
      label: 'NASA Science — Neptune Facts',
      url: 'https://science.nasa.gov/neptune/neptune-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'neptune-triton-retrograde',
    title: "Triton's retrograde orbit",
    summary:
      "Neptune's largest moon, Triton, follows a retrograde orbit opposite Neptune's rotation, suggesting it may have been captured.",
    source: {
      label: 'NASA Science — Neptune Facts',
      url: 'https://science.nasa.gov/neptune/neptune-facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'pluto-charon-system',
    title: 'Pluto and Charon',
    summary:
      'Charon is roughly half the size of Pluto, and the two worlds are tidally locked so the same hemispheres continually face each other.',
    source: {
      label: 'NASA Science — Pluto Facts',
      url: 'https://science.nasa.gov/dwarf-planets/pluto/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'pluto-heart-shaped-region',
    title: "Pluto's heart-shaped region",
    summary:
      "Pluto's bright heart-shaped feature is called Tombaugh Regio and includes a vast basin filled largely with nitrogen ice.",
    source: {
      label: 'NASA Science — Pluto Facts',
      url: 'https://science.nasa.gov/dwarf-planets/pluto/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'sun-nuclear-fusion',
    title: "The Sun's energy source",
    summary:
      "Nuclear fusion in the Sun's core combines hydrogen into helium and releases the energy that ultimately reaches space as light and heat.",
    source: {
      label: 'NASA Science — Sun Facts',
      url: 'https://science.nasa.gov/sun/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'sun-age-and-light-time',
    title: 'The age and light of the Sun',
    summary:
      'The Sun is about 4.6 billion years old, and its light takes about eight minutes to reach Earth.',
    source: {
      label: 'NASA Science — Sun Facts',
      url: 'https://science.nasa.gov/sun/facts/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'iss-orbit',
    title: 'The orbit of the International Space Station',
    summary:
      'The International Space Station follows an orbit inclined 51.6 degrees to the equator. That inclination made the station easier to reach with both U.S. Space Shuttle launches and Russian rockets.',
    source: {
      label: 'NASA Earth Observatory — Catalog of Earth Satellite Orbits',
      url: 'https://science.nasa.gov/earth/earth-observatory/catalog-of-earth-satellite-orbits/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'iss-orbital-period',
    title: 'How quickly the ISS circles Earth',
    summary:
      'The International Space Station travels from west to east and completes one orbit in roughly 90 to 93 minutes; the exact period varies with its altitude.',
    source: {
      label: 'NASA — Space Station Orbit Tutorial',
      url: 'https://eol.jsc.nasa.gov/Tools/orbitTutorial.htm',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'iss-microgravity-laboratory',
    title: 'Research aboard the ISS',
    summary:
      'The International Space Station is a microgravity laboratory where crews conduct research in biology, human health, physical science, Earth science, and technology.',
    source: {
      label: 'NASA — International Space Station',
      url: 'https://www.nasa.gov/reference/international-space-station/',
    },
    reviewedOn: '2026-08-01',
  },
  {
    id: 'iss-international-partnership',
    title: 'International cooperation on the ISS',
    summary:
      'The International Space Station was assembled and operated through a long-running international partnership among space agencies and participating nations.',
    source: {
      label: 'NASA — International Space Station',
      url: 'https://www.nasa.gov/reference/international-space-station/',
    },
    reviewedOn: '2026-08-01',
  },
] as const satisfies readonly KnowledgeEntry[];

export const knowledgeById: ReadonlyMap<string, KnowledgeEntry> = new Map(
  knowledgeEntries.map((entry) => [entry.id, entry]),
);
