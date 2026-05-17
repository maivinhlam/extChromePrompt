# 75-Scene Industrial Logic Framework

This framework is designed to create AI Video scripts with high technical accuracy, image consistency, and industrial-scale production.

---

## 1. Core Principle: Identity Locking

**Goal:** Prevent AI from arbitrarily changing the appearance of objects (for example, filming an apple that suddenly looks like a tomato).  
**Rule:** The product’s main keyword (for example **red apple fruit**, **green pear tree**) **MUST** appear in every component of a Scene:

- In the visual description
- In the action description
- In the voice-over (VO)
- In the background description

---

## 2. The 9-Layer Scene Template

Each scene must follow this standard structure so AI can deeply understand context and technical details.  
**Note:** one scene per line, 75 scenes = 75 lines. Each part is separated by `" | "`, with component names in uppercase (for example `VO abc | VOCAL TONE: xyz`):

1. **SCENE X:** Scene number (separated from the rest by a colon).
2. **Visual Prompt:** General context description (Style: realistic industrial, Lighting: sunrise or golden hour, Subject: mature fruit).
3. **Action Title:** Short action name (for example _Extreme macro growth montage_).
4. **Visual Logic:** **[IMPORTANT]** Detailed physical constraints — **see Section 4 Visual Logic Library** for full rules and object-specific constraints.
5. **SOUND:** Detailed environmental sound (Foley) (for example soft breeze, distant birds, mechanical hum).
6. **VO:** Voice-over content.
7. **Vocal Tone:** Voice-over characteristics (for example deep American male, middle-aged, calm, precise). Leave blank if VO is empty.
8. **CAMERA:** Professional cinematography terms (for example locked macro push-in, vertical rise to top-down master).
9. **IMAGES:** Reference images list (max 3). Use from pre-generated list.

---

## 3. Object Physics Library

1. **Irrigation system:** Water only exits emitters; soil darkens only when water touches.
2. **Plow and Tiller:** Blade must sink into soil; front equals hard soil or grass, back equals loosened furrow; smoke only from exhaust pipe.
3. **Branches and Fruit:** Fruit attaches via stem; heavy branches sag downward.
4. **Conveyor belt:** Objects move with belt direction; no rolling uphill without stopper.
5. **Robot arm:** Joints rotate mechanically; gripper must hold object firmly, no clipping. For large shiny fruit, suction head may be used.

---

## 4. Visual Logic Library

**Purpose:** Centralized, authoritative rules for how every object class behaves visually and physically. All Scene-level `Visual Logic` fields must reference and comply with the rules below.

| Object Category               | Visual Logic Rules                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plant and Fruit**           | Fruit attaches to stem; heavy fruit causes sagging; growth gradual; reflections follow surface normals; fruit falls only when cut or forced.            |
| **Soil and Ground**           | Tires compress soil; tread depth proportional to weight; soil darkens when wet; plows eject soil in arcs; clods crumble under gravity.                  |
| **Water and Irrigation**      | Water only from emitters; droplets follow ballistic arcs; hoses swell under pressure; spray cones widen with distance; soil instantly darkens when wet. |
| **Machinery Large**           | Moving parts rotate at pivots; blades show friction; soil reacts only at contact; smoke only from exhaust.                                              |
| **Robotics and Conveyors**    | Joints rotate mechanically; grippers clamp without clipping; conveyors move items at belt speed; no uphill rolling without stopper.                     |
| **Drones and Aerial Systems** | Propellers blur; downdraft bends vegetation; flight paths smooth; spraying mist falls under gravity; drone shadows align with sun.                      |
| **Rovers and Field Robots**   | Tracks grip soil; probes meet resistance; rover stationary when sampling; UI updates logically.                                                         |
| **Vehicles and Forklifts**    | Pallets stable on forks; tires compress under load; trucks raise dust; chassis bounces on uneven terrain.                                               |
| **Human Workers**             | Hands and gloves contact realistically; posture matches action; protective gear creases and resists thorns.                                             |
| **Post-harvest & Logistics**  | Fruit moves with conveyors; optical sorters emit beams; crates stack with gravity; cold vapor only at openings; packaging folds along seams.            |
| **Sensors and Network**       | Sensor poles rigid; anemometers spin with wind; LEDs blink at intervals; no visible “data beams” unless UI overlay.                                     |
| **Environmental & Lighting**  | Shadows consistent with light source; reflections move with camera; fast-moving parts show motion blur.                                                 |

---

## 5. Industrial Lifecycle Content Structure

A professional 75-scene script typically follows this logical sequence:

| Stage                 | Focus                                                            |
| --------------------- | ---------------------------------------------------------------- |
| 1 Hook Scenes 1–3     | Most beautiful shots, close-ups of ripe fruit to impress viewers |
| 2 Propagation Nursery | Seeds, conveyor systems, optical inspection, grafting            |
| 3 Infrastructure      | Plowing, irrigation installation, support wires                  |
| 4 Establishment       | Automated planting, first watering                               |
| 5 Maintenance         | Drone monitoring, auto mowing, fertigation                       |
| 6 Growth              | Sprouts, buds, flowering, fruit set, fruit enlargement           |
| 7 Harvest             | Preparing containers, assisted harvesting machines, storage      |
| 8 Post-harvest        | Pre-cooling, washing, optical sorting, packaging, transport      |
| 9 Conclusion          | Farm panorama at sunset, highlighting sustainability and system  |

---

## 6. Technical Support Rules

**a. Multiplicity Rule**  
Use specific numbers for machinery to convey industrial scale.

- Wrong: “A tractor is working in the field.”
- Correct: “Seven tractors working in parallel across a marked planting block.”

**b. Single Action Focus**  
Each 8-second scene should describe only one technical action. Avoid combining multiple complex actions.

**c. Preferred Camera Terms**  
Use stable AI Video camera terms:

- Locked macro (static extreme close-up)
- Smooth backward glide (slow smooth pullback)
- High drone establishing shot (wide aerial context)
- Ultra-low close tracking (ground-level tracking shot)

---

## 7. Reference Images

Before writing 75 scenes, generate a list of reference images and prompts to ensure visual consistency.

- Each scene should select images from this list.
- Format: `Image 1: xxx`
- One image can be reused across multiple scenes (for example man, leaf, branch, flower, ripe fruit, green fruit).

---

## Quick Implementation Notes

- **When filling Scene Visual Logic:** always reference the specific subsection in **Section 4 Visual Logic Library** (for example `VISUAL LOGIC: see Visual Logic Library — Drones and Aerial Systems; downdraft bends fronds`).
- **Checklist before finalizing each scene:** Identity Locking; Single Action Focus; Visual Logic compliance; Multiplicity numbers; Contact Points present; Shadow and reflection consistency.
