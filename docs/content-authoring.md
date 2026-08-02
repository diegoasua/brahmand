# Content authoring

## Knowledge entries

Scientific claims live in `src/content/knowledge.ts`. Each entry contains:

- a stable ID and topic;
- a concise, player-facing summary;
- a primary or authoritative source URL;
- the date a person last reviewed it.

The summary should state one teachable idea, avoid false precision, and distinguish an analogy from a physical claim. Changing a source or material claim should trigger editorial review.

## NPCs

An NPC definition contains character presentation, an Inworld voice ID, and an allowlist of knowledge IDs. A dialogue model receives the relevant allowlisted entries, the current story beat, and a bounded conversation history.

Each interactable contact should have several independently useful knowledge entries. Quick-fact mode chooses an unseen reviewed entry for the current play session before repeating and remains closed-book. Conversation mode uses the complete allowlist as preferred anchors, but can answer related questions from well-established general science. It must qualify uncertain or debated claims and must not fabricate measurements, sources, missions, or discoveries.

Plan for planets and stars to be characters without implying that invented personality is scientific fact. UI and writing can signal when a line is metaphor, story lore, or reviewed science.

## Quests

Quest definitions describe semantic objectives such as visiting a target or opening a channel. They do not contain Three.js positions, keyboard bindings, or scene objects. This lets content survive control changes, accessibility modes, and later world re-scaling.

The current `commissioningQuests` sequence exists only to exercise the systems. Future chapters should live in their own content modules and carry a schema version before save files are introduced.
