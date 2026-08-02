# Brahmand

Brahmand is a Three.js space-exploration story rooted in real science. The player pilots a ship through a stylized 3D universe, follows a mostly linear chain of discovery quests, and learns through conversations with planets, ships, and other characters.

This repository currently contains a **commissioning sandbox**, not the game or its final story. Its job is to prove the seams between flight, celestial objects, interactions, quest progression, grounded dialogue, and Inworld text-to-speech while the narrative and art are still being developed.

## Run it

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>. With `INWORLD_API_KEY` configured, AURA's arrival dialogue is generated through Inworld Realtime Router using DeepSeek V4 Flash and spoken with the configured cloned voice. Without credentials, a deterministic grounded fallback keeps local navigation testable.

Controls:

- `W` / `S`: forward and reverse thrust
- `A` / `D`: yaw
- Arrow keys: pitch
- `Q` / `E`: roll
- `Shift`: boost
- `F`: hear a quick, non-repeating fact about a nearby contact
- `C`: open a text conversation with AURA about the nearby contact

Useful commands:

```bash
npm run dev         # game client and API together
npm run check       # types, lint, and tests
npm run build       # production client build
npm run dev:game    # renderer only
npm run dev:api     # API only
```

## Architecture

```text
Browser / Three.js
  flight + camera + interaction + HUD
                 |
                 | typed HTTP contracts
                 v
Node API gateway
  dialogue provider + curated knowledge + Inworld TTS
```

The browser never receives vendor API keys. Dialogue generation is behind a provider interface and currently uses `deepinfra/deepseek-ai/DeepSeek-V4-Flash` through Inworld Realtime Router. Inworld TTS is wired behind `POST /api/speech`; if no key is configured, fallback dialogue remains readable and the API reports speech as unavailable.

Science is content, not prompt decoration. Facts have an explicit source and review date, NPCs are allowed to use selected knowledge entries, and generated dialogue should be grounded only in that curated context. See [docs/architecture.md](docs/architecture.md), [docs/content-authoring.md](docs/content-authoring.md), the [asset pipeline](docs/assets.md), and the [story bible](docs/story/story-bible.md).

## Repository map

```text
src/content/       Celestial bodies, vetted knowledge, commissioning quests
src/domain/        Vendor-free quest and narrative rules
src/game/          Three.js scene, ship, camera, input, interactions
src/services/      Browser API client and dialogue orchestration
src/shared/        Contracts shared by browser and server
src/ui/            HUD and presentation
server/            Secret-holding API and provider integrations
tests/             Fast domain tests
docs/              Architecture and content conventions
public/assets/     Future models, textures, and authored audio
```

## Current boundaries

- Display positions and sizes are intentionally compressed and are never presented as physical scale.
- The commissioning quest is disposable scaffolding, separate from future authored chapters.
- Live AURA dialogue is generated on demand, but receives only the target's approved knowledge entries and current quest context. A deterministic provider exists solely for offline development.
- No final asset format, physics engine, persistence layer, or deployment platform has been chosen yet.

## Near-term milestones

1. Replace primitive geometry with the first ship and celestial assets.
2. Import the authored opening chapter as data, without embedding story rules in renderer code.
3. Select the production dialogue model and add grounded-output validation.
4. Move from complete-response MP3 speech to streaming TTS if playtesting shows latency warrants it.
5. Add save-state versioning once quest structure stabilizes.

The first authored mission is being designed in [Chapter 1: The Lost Knowledge Civilization](docs/story/chapter-01-lost-knowledge.md).
