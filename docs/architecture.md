# Architecture notes

## Design goals

The scaffold keeps four concerns independent:

1. **Simulation** updates the ship, camera, celestial proxies, and interaction range.
2. **Narrative** advances an ordered quest sequence from semantic events such as `visited` and `talked`.
3. **Knowledge** stores reviewed scientific claims and their sources separately from character voice and story prose.
4. **Generative services** turn approved context into dialogue or audio behind replaceable interfaces.

Three.js objects should not become save data. Stable string IDs connect renderer objects to quests, NPC definitions, knowledge, and future persistence.

## Runtime flow

```text
Input -> PlayerShip -> ExplorationScene -> semantic event -> QuestDirector
                                  |
                   +--------------+--------------+
                   |                             |
                   v                             v
           DialogueController        VoiceConversationController
                   |                             |
       POST /api/dialogue, /speech       WebRTC microphone/audio
                   |                     via server-proxied SDP
                   +--------------+--------------+
                                  |
                         Inworld services
```

When an Inworld key is configured, the API's dialogue provider sends grounded context to DeepSeek V4 Flash through Inworld Realtime Router. The deterministic provider is retained only so local development remains useful without external services; both satisfy the same `DialogueProvider` interface.

Dialogue requests carry bounded arrival and quick-fact intents. The browser remembers science-entry IDs already used for each target during the current play session, and quick-fact requests exclude those entries until the target's pool is exhausted.

Pressing `C` creates a target-specific Inworld Realtime API session over WebRTC. The browser sends microphone audio as a native WebRTC track; Inworld STT and semantic voice activity detection establish turns, DeepSeek answers with reviewed target facts as preferred anchors plus a guarded well-established-science policy, and Inworld TTS-2 returns the cloned AURA voice as a remote audio track. Transcripts remain visible for accessibility, but there is no text-entry interaction. After session setup the microphone track remains active, matching Inworld's continuous WebRTC flow; browser echo cancellation and server turn detection prevent AURA's output from becoming a new player turn.

## Trust boundaries

- `INWORLD_API_KEY` exists only in the Node process.
- ICE and SDP exchange requests are authenticated by the Node gateway; the key is never returned in realtime configuration.
- The API validates request size and shape before calling paid services.
- The client decides presentation; the server decides which knowledge an NPC may use.
- Realtime conversation history is context, not scientific authority. The session prefers server-supplied reviewed anchors, permits broadly accepted science for open questions, and requires uncertainty to be stated rather than replaced with fabricated specifics.
- Model text must eventually pass citation/claim checks before it can affect quest state.
- Narrative text is generated on demand, while quest completion remains deterministic and cannot be changed by the model.
- TTS failure is non-fatal. On-screen dialogue remains the accessible source of truth.

## Scale

The commissioning scene uses artistic display units. Content fields deliberately say `displayPosition` and `displayRadius`; physical quantities should use explicit units such as `massKg` or `meanRadiusKm`. Never infer educational facts from rendered scale.

## Intentional omissions

These choices should follow real content and playtests rather than precede them:

- physics engine and collision model
- save backend and user accounts
- procedural universe generation
- final LLM provider and moderation policy
- asset pipeline and compression targets
