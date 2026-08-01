# Chapter 1: The Lost Knowledge Civilization

Subtitle: **The Broken Circuit**

Status: narrative and mission design draft

Estimated first-play duration: 6–10 minutes

## Purpose

Chapter 1 introduces flight, scanning, conversation, evidence-based decisions, and the central mystery without leaving the continuous space map. Its lesson is not simply “copper is correct.” The player learns that copper and aluminum both conduct electricity, insulators are also essential to safe wiring, and engineering choices depend on several constraints at once.

By the end of the chapter, the player should be able to:

- distinguish an electrical conductor from an insulator;
- explain that mobile conduction electrons allow charge to move through a metal;
- recognize copper and aluminum as conductors;
- understand that a spacecraft distributes electrical power through circuits and a main bus;
- choose a repair component using conductivity, mass, geometry, and compatibility rather than one property alone.

## Setting

Asteria awakens in a fictional orbital assembly corridor in near-Earth space. Earth and the Moon are the real astronomical landmarks in the scene. The construction yard, service beacons, and material cartridges are human technology from 2147.

Asteria's main drive is offline. Fault protection has isolated an open section of its electrical distribution bus before the failure can damage other systems. Low-power maneuvering thrusters, navigation, scanning, and AURA remain available, giving the player a credible way to move locally while the main drive is disabled.

No action takes place inside the ship. Diagnosis appears through the flight HUD, and an exterior utility system retrieves and installs the repair cartridge while Asteria remains under player control.

## Cast

### Asteria

The ship and the player's body in the world. Asteria communicates through movement, scanning, system sounds, and interface responses rather than spoken protagonist dialogue.

### AURA

Asteria's surviving guidance and knowledge interface.

- Voice ID: placeholder
- Tone: calm, curious, concise, never patronizing
- Teaching style: asks for observations before giving conclusions
- Limitation: can access local sensors and fragments of reviewed knowledge, but cannot restore the damaged bus or missing archive alone

AURA should say “we do not have enough evidence yet” when appropriate. Its confidence should reflect the available scan data.

## Opening

The scene begins almost silent. Earth occupies part of the distant view; the Moon is visible beyond it. Most of Asteria is dark, and the disabled main drive emits no light.

Minimal systems boot one at a time:

```text
NAVIGATION ........ AVAILABLE
MANEUVERING ....... LIMITED
MAIN DRIVE ........ ISOLATED
SCIENCE ARCHIVE ... FRAGMENTED
AURA .............. RECOVERING
```

AURA's first line:

> Navigation is awake. The main drive is not. Fault protection has isolated an open circuit in our power bus. We can maneuver, but we cannot leave this region.

The first navigation marker appears at a diagnostic relay a short distance ahead.

## Mission flow

### Beat 1 — Learn to move

**Objective:** Reach the diagnostic relay.

The player uses limited thrust and orientation controls. The main drive remains visually distinct from the maneuvering system so the fiction does not imply that a completely powerless spacecraft can accelerate normally.

At the relay, AURA reads the fault:

> The energy source is working, but the path is broken. A circuit needs a continuous conducting path. The damaged bridge must be replaced before current can reach the drive controller.

This establishes a key distinction: the ship does not need to “find energy”; it needs to restore power distribution.

### Beat 2 — Find the service canisters

**Objective:** Locate four drifting service canisters using the scanner.

Each canister has a unique silhouette and scan signature. The scanner reports observations, not answer labels. The player may visit them in any order, while the overall chapter remains linear.

#### Copper braid cartridge

- Classification: electrical conductor
- Relevant properties: high conductivity, ductile enough to form wire, compatible terminal geometry
- Tradeoff: denser than aluminum
- Mission status: suitable repair component

#### Aluminum mesh cartridge

- Classification: electrical conductor
- Relevant properties: lower density than copper and useful in spacecraft structures and conductors
- Tradeoff: this cartridge does not match the damaged bus terminals without an unavailable adapter
- Mission status: scientifically valid conductor, unsuitable cartridge for this particular repair

#### Polyimide insulation cartridge

- Classification: electrical insulator
- Relevant properties: prevents unintended contact between conductive paths; insulation is essential to safe wiring
- Mission status: useful material, but cannot bridge the conducting path

#### Ceramic thermal spacer

- Classification: electrical insulator for the purpose of this encounter
- Relevant properties: resists charge flow and tolerates heat
- Mission status: useful near hot electrical hardware, but cannot close the bus circuit

Material behavior depends on composition, temperature, geometry, and environment. The game should not imply that every ceramic or polymer behaves identically under all conditions.

### Beat 3 — Classify before choosing

**Objective:** Identify every cartridge that can conduct electricity.

AURA asks:

> Two of these materials allow electric charge to move readily. Which ones are conductors?

Valid answer: **copper and aluminum**. The player can respond through speech, text, or object selection.

Response:

> Correct. Copper and aluminum are both conductors. In metals, mobile electrons respond to an electric field and carry current. The other materials are valuable because they resist that movement and help keep current on its intended path.

If the player chooses only copper, AURA does not mark the idea wholly wrong:

> Copper is one conductor. Scan the lightweight metal again—being lighter does not make aluminum an insulator.

If the player selects an insulator:

> That material is important for controlling electricity, but not by carrying current. Its job is to keep conductive paths separated.

### Beat 4 — Make the engineering decision

**Objective:** Select the cartridge that can restore this specific bus connection.

AURA asks a narrower question:

> Both metal cartridges conduct. Our repair must also fit the existing terminals without an adapter. Which cartridge satisfies both requirements?

Preferred answer: **the copper braid cartridge**.

Response:

> The copper braid conducts well and matches the existing terminal assembly. Aluminum could carry current and would save mass, but this cartridge cannot make a reliable connection here. Engineering means choosing for the whole problem, not a single property.

The compatibility constraint belongs to the fictional repair cartridge, not to aluminum as a universal material. The dialogue must preserve that distinction.

### Beat 5 — Retrieve and repair

**Objective:** Approach the copper cartridge and hold position while the exterior utility system retrieves it.

A visible tether or robotic utility arm secures the cartridge. Asteria automatically installs the component; the player never enters an interior scene. The repair sequence shows a continuous electrical path on a simplified HUD schematic.

AURA asks one final prediction before energizing the bus:

> The conducting bridge is installed and the circuit is closed. What should we observe when the bus is energized?

Accepted concepts include current reaching the drive controller, the controller powering on, or the main drive becoming available. Exact wording is not required.

### Beat 6 — Restore the main drive

Power returns in stages rather than as a single explosion of light:

```text
BUS CONTINUITY ..... CONFIRMED
CURRENT ............ NOMINAL
DRIVE CONTROL ...... ONLINE
MAIN DRIVE ......... AVAILABLE
ARCHIVE FRAGMENT ... 01 RESTORED
```

The drive illuminates, the flight soundscape broadens, and the long-range navigation marker appears.

AURA closes the chapter:

> The drive is restored—and with it, one fragment of the Science Archive. Knowledge returned because you tested the evidence, not because you guessed. There are more fragments beyond Earth.

The player remains in control as the next destination becomes visible. There is no score screen or map transition.

## Answer evaluation

Quest progress uses deterministic concepts rather than an LLM's opinion.

| Prompt | Accepted concepts | Useful partial answer | Misconception to correct |
|---|---|---|---|
| Which materials conduct? | copper **and** aluminum | either metal alone | insulation is not “useless”; it controls current paths |
| Which cartridge fits this repair? | copper braid/cartridge | aluminum is recognized as conductive | aluminum is not rejected for being an insulator |
| What happens after closing the circuit? | current reaches controller; controller/drive powers on | circuit becomes complete | a conductor does not create energy |

Speech-to-text may normalize phrasing and an LLM may make AURA's response natural, but a small validated concept set determines completion. Repeated mistakes never remove progress or points; AURA offers another observation or comparison.

## Grounded science notes

These claims are safe foundations for player-facing dialogue:

- Conductors allow electric charge to move readily; metals such as copper, silver, and aluminum are conductors. Insulators such as rubber, glass, and many plastics resist charge movement.
- In a metal, mobile conduction electrons respond to an applied electric field. Individual electrons have a relatively slow average drift; the lesson should not depict one electron racing unimpeded through the entire wire.
- Copper has higher electrical conductivity by volume than aluminum, while aluminum has much lower density. That makes material selection a tradeoff rather than a universal ranking.
- Spacecraft use power-management and distribution systems to regulate, switch, monitor, and deliver electrical energy to their subsystems.
- Insulation is a functional part of a wiring system, helping isolate conductive paths and reduce unintended current flow or arcing.

### Sources for editorial review

- [OpenStax University Physics: Conductors, Insulators, and Charging by Induction](https://openstax.org/books/university-physics-volume-2/pages/5-2-conductors-insulators-and-charging-by-induction)
- [OpenStax University Physics: Model of Conduction in Metals](https://openstax.org/books/university-physics-volume-2/pages/9-2-model-of-conduction-in-metals)
- [NASA Science: Basics of Space Flight — Onboard Systems](https://science.nasa.gov/learn/basics-of-space-flight/chapter11-3/)
- [NASA Small Spacecraft Systems: Power Subsystems](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/)
- [NASA flight wiring material comparison: copper and aluminum conductivity and density](https://ntrs.nasa.gov/api/citations/20205002398/downloads/CoP%20Wiring%20%26%20Connectors%20Jun%202020.pdf?attachment=true)
- [NASA: Operational Environments for Electrical Power Wiring on NASA Space Systems](https://ntrs.nasa.gov/citations/19940032444)

Before final dialogue ships, the exact wording and any numerical scan values should receive a human science review.

## Generative-dialogue boundary

AURA's dialogue request may receive:

- the current mission beat;
- scan results already observed by the player;
- the accepted and partial concepts for the current prompt;
- only the reviewed knowledge entries relevant to that beat;
- a short bounded conversation history.

It must not receive authority to change the quest state, invent a material property, or contradict the deterministic evaluator. If generation fails, authored fallback lines in this document keep the chapter playable.

## Asset list

Placeholder geometry is sufficient for the first implementation. Final or near-final assets can arrive independently:

- Asteria exterior with distinct maneuvering and main-drive emitters
- Earth and Moon presentation assets
- diagnostic relay
- four visually distinct service canisters
- exterior tether or utility-arm effect
- scan pulse and material highlight effects
- power-bus schematic UI
- disabled, repairing, and restored drive effects
- AURA voice mapping and system sound palette

No cockpit, humanoid avatar, or engine-room interior is required.

## Completion criteria

- The entire chapter occurs in the continuous flight scene.
- A player can finish with voice disabled.
- Copper and aluminum are both recognized as conductors.
- Copper wins the final decision because of explicit mission constraints, not because it is the only conductor.
- Reviewed science is visually distinguishable from story fiction.
- An incorrect answer produces a useful explanation and no penalty.
- The final repair visibly changes Asteria and unlocks long-range travel.
- Scientific sources are available from the dialogue or codex interface.
