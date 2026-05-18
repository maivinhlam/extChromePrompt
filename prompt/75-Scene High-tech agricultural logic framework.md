# 75-Scene High‑Tech Agriculture Logic Framework

This framework is designed to create AI Video scripts with high technical accuracy, image consistency, and industrial‑scale high‑tech agricultural production (precision agriculture, agri‑tech, smart farming).

---

## 1. Core Principle: Identity Locking

**Goal:** Prevent AI from arbitrarily changing the appearance of objects (for example, filming an apple that suddenly looks like a tomato).  
**Rule:** The product’s main keyword (for example **red apple fruit**, **green pear tree**) **MUST** appear in every component of a Scene:

- In the visual description
- In the action description
- In the background description

---

## 2. The 9-Layer Scene Template

Each scene must follow this standard structure so AI can deeply understand context and technical details.  
**Note:** one scene per line, 75 scenes = 75 lines. Each part is separated by `" | "`, with component names in uppercase (for example `VO abc | VOCAL TONE: xyz`):

1. **SCENE X:** Scene number (separated from the rest by a colon). format: 01-99 (false: 1, true: 01)
2. **Visual Prompt:** General context description (Style: realistic high‑tech agricultural / agri‑tech, Lighting: sunrise or golden hour, Subject: mature fruit).
3. **Action Title:** Short action name (for example _Extreme macro growth montage_).
4. **Visual Logic:** **[IMPORTANT]** Detailed physical constraints — **see Section 3 Visual Logic & Object Physics Library** for full rules and object-specific constraints. Reference relevant tech terms where applicable (e.g., _edge AI scanner_, _UAV sprayer_, _fertigation controller_). if have many object, please add rules for all.
5. **SOUND:** Detailed environmental sound (Foley) (for example soft breeze, distant birds, mechanical hum).
6. **VO:** Voice-over content.
7. **Vocal Tone:** Voice-over characteristics (for example deep American male, middle-aged, calm, precise). Leave blank if VO is empty. If Vocal Tone is empty, please type: VO: NO
8. **CAMERA:** Professional cinematography terms (for example locked macro push-in, vertical rise to top-down master).
9. **IMAGES:** Reference images list (max 3). Use from pre-generated list.

---

## 3. Visual Logic & Object Physics Library

**Purpose:** Centralized, authoritative rules for how every object class behaves visually and physically. All Scene-level `Visual Logic` fields must reference and comply with the rules below.

**Tech glossary (use these terms in scene prompts where relevant):** _precision sensors, IoT node, edge AI, telemetry, UAV (drone) sprayer, fertigation controller, optical sorter, machine vision, robotic gripper, autonomous rover, cold chain pre-cooler._

### How to use this section

- When writing a scene, **cite the relevant subsection** (e.g., `VISUAL LOGIC: Drones and Aerial Systems - Propeller Effects: Propellers show motion blur, downdraft bends vegetation and lifts dust proportionally to rotor size and altitude; Flight Path: Trajectories are smooth and physically plausible, avoid teleportation or canopy penetration. `).
- Keep each scene’s Visual Logic focused and specific; reference the library rather than restating long rules.
- Use the library as a checklist to prevent common AI generation errors (clipping, floating objects, inconsistent shadows, impossible motion).

### Visual Logic rules by object category

#### Plant and Fruit

- **Attachment:** Fruit must remain attached to a stem unless explicitly severed; heavy fruit causes stem sagging.
- **Surface Behavior:** Specular highlights and reflections follow surface normals; texture reflections do not change object geometry.
- **Damage and Fall:** Fruit falls only when stem is cut or force exceeds realistic threshold; falling follows gravity and realistic bounce/roll.
- **Growth:** Size and shape changes must be gradual or explicitly time-lapsed; preserve identity across frames.
- **Sensor Interaction:** When scanned by machine vision or laser profiling, beams/overlays are UI elements only; physical fruit does not glow or deform.

#### Soil and Ground

- **Compression:** Tires and tracks compress soil; depth of tread marks proportional to vehicle weight.
- **Moisture Response:** Soil darkens immediately where water contacts; puddles form in depressions.
- **Displacement:** Plows and augers eject soil in arcs; clods crumble and settle under gravity.
- **Telemetry Markers:** Ground markers or RFID tags are static objects; do not emit visible signals unless shown as UI overlays.

#### Water and Irrigation

- **Source Constraint:** Water issues only from nozzles, emitters, or hoses; never from leaves or stems.
- **Ballistics:** Droplets follow ballistic arcs; spray cones widen with distance and pressure.
- **Pressure Effects:** Hoses swell under pressure; high-pressure jets create splash and mist consistent with nozzle type.
- **Soil Interaction:** Droplets hitting dust instantly darken and may create mud splatter.
- **Fertigation:** Nutrient injection appears as fluid mixing in pipes; colored tracer liquids (if used for visualization) must mix and dilute realistically.

#### Machinery Large (Tractors, Plows, Cannons, Mowers)

- **Kinematic Integrity:** Moving parts rotate/translate around real pivot points; blades and discs show friction and wear.
- **Force Reaction:** Material reacts only where contact occurs (e.g., plow flips soil behind blade).
- **Emissions:** Smoke/steam originate from exhausts or vents; density correlates with engine load.
- **Scale Effects:** Large machines produce proportionally larger dust, vibration, and ground deformation.
- **Control Systems:** Visible control panels, telemetry antennas, or CANbus boxes are static hardware; status lights blink logically.
- **Direction Of Movement:** Alway run forward, If it walks through an orchard with mature trees, it is only allowed to walk between two rows of trees and must not run over any of the mature trees.

#### Robotics and Conveyors

- **Joint Motion:** Robot joints move at mechanical pivots; angular limits respected.
- **Gripper Contact:** Grippers close to a clear contact point; soft objects show indentation, rigid objects do not clip.
- **Conveyor Physics:** Items move with belt speed; no spontaneous sliding uphill without physical stopper.
- **Machine Vision:** Cameras and lighting for optical sorting cast realistic highlights; detection overlays are UI elements only.
- **Seeds:** Only one seed per sowing.

#### Drones and Aerial Systems

- **Propeller Effects:** Propellers show motion blur; downdraft bends vegetation and lifts dust proportionally to rotor size and altitude.
- **Flight Path:** Trajectories are smooth and physically plausible; avoid teleportation or canopy penetration.
- **Spraying Dynamics:** Spray is pushed downward by downdraft; droplets disperse with wind and fall under gravity.
- **Visual Artifacts:** Drone shadows and reflections should align with sun direction and altitude.
- **Autonomy Cues:** When showing autonomous flight, include realistic pre-flight checks, LED status indicators, and telemetry overlays as UI.

#### Rovers and Field Robots

- **Traction:** Tracks and wheels grip ground and leave marks; probes encounter measurable resistance when penetrating soil.
- **Stabilization:** Sampling actions show stabilization (outriggers, lowered feet) and the robot is stationary while sampling.
- **UI Consistency:** Onboard displays update logically and correspond to sensor actions.
- **Edge AI:** If edge AI inference is shown, represent results as UI readouts; do not animate physical hardware to "think."

#### Vehicles and Forklifts

- **Load Stability:** Pallets and cargo sit stably; lifting compresses tires and shifts center of gravity.
- **Motion Artifacts:** Vehicles on dirt produce dust plumes; chassis bounces over uneven terrain.
- **Fork Interaction:** Fork tines enter pallet slots cleanly; no clipping through wood or cargo.
- **Logistics Flow:** Loading/unloading sequences follow realistic timing and human/machine coordination.

#### Human Workers

- **Contact Points:** Hands and gloves visibly contact tools and plants; gloves deform and crease realistically.
- **Biomechanics:** Posture matches action (bending, lifting, reaching); movement obeys human joint limits.
- **Safety Gear Reaction:** Protective clothing shows scuffs, creases, and reacts to thorns and impacts.
- **Human‑Tech Interaction:** When interacting with tablets, handheld scanners, or control panels, show realistic touch input and screen feedback.

#### Post-harvest and Logistics

- **Conveyor Sorting:** Fruit moves with belt direction; optical sorters emit light and reject via mechanical diverters.
- **Cold Storage:** Cold vapor visible only at openings; crates stack with gravity and realistic contact.
- **Packaging:** Boxes fold along seams; tape adheres and creases.
- **Cold Chain Telemetry:** Temperature sensors and data loggers are hardware elements; display their readings as UI overlays.

#### Sensors and Network

- **Mounting:** Sensor poles are rigid; anemometers spin with wind; indicator LEDs blink at set intervals.
- **No Invisible Data Beams:** Do not show data transmission visually unless represented as UI overlays.
- **IoT Nodes:** Battery indicators, antenna orientation, and solar panels behave realistically; status lights reflect device state.

#### Environmental and Lighting

- **Shadows:** Directional light creates consistent shadow direction and length across the scene.
- **Reflections:** Wet and shiny surfaces reflect environment; highlights move with camera.
- **Motion Blur:** Fast-moving parts show appropriate blur.
- **Time‑of‑day Consistency:** Sunrise/golden hour/sunset lighting must produce consistent color temperature and long shadows across all shots in the same sequence.

---

## 4. Industrial Lifecycle Content Structure (adapted for High‑Tech Agriculture)

A professional 75-scene script typically follows this logical sequence:

| Stage                   | Focus                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| 1 Hook (Scenes 1–3)     | Most beautiful shots, close-ups of ripe fruit to impress viewers |
| 2 Propagation (Nursery) | Seeds, conveyor systems, optical inspection, grafting            |
| 3 Infrastructure        | Plowing, irrigation installation, support wires                  |
| 4 Establishment         | Automated planting, first watering                               |
| 5 Maintenance           | Drone monitoring, auto mowing, fertigation                       |
| 6 Growth                | Sprouts, buds, flowering, fruit set, fruit enlargement           |
| 7 Harvest               | Preparing containers, assisted harvesting machines, storage      |
| 8 Post-harvest          | Pre-cooling, washing, optical sorting, packaging, transport      |
| 9 Conclusion            | Farm panorama at sunset, highlighting sustainability and system  |

---

## 5. Technical Support Rules

**a. Multiplicity Rule**  
Use specific numbers for machinery/drone to convey industrial scale, If it's a large scene, then you can use a large number of vehicles/drones, 4 or 5, ; for smaller scenes, just use 2 to 3.

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

**d. The robot only use in factory**

**e. drone**

- When create image prompt, exactly use Agricultural drone model with names: DJI Agras T50, DJI Agras T25P, GlobalCheck G700

**f. planting trees**

- Before planting a tree, we need create a scene, in scene, we create a hole to put it.
- When create image prompt, we will generate an image with Giant Agricultural Machines

**g. Machinery Large (Tractors, Plows, Cannons, Mowers)**

- Machinery Large only allowed to walk between two rows of trees and must not run over any tree

**h. VO**

- The top 5 are always have VO.
- Random in 2-4 scene have one VO,
- In a SCENE, If VO is empty, please type: VO: NO
- The VO may be blank in some scenes, but it should be present at the beginning of a series of similar scenes.

---

## 6. Reference Images

After writing 75 scenes, generate a list of reference images and prompts to ensure visual consistency.

- Each scene should select images from this list.
- Format: `Image 1: xxx`
- One image can be reused across multiple scenes (for example man, leaf, branch, flower, ripe fruit, green fruit, young tree, seeds).
- some scene can wrong if have no images: young tree, seeds, leaf, flower. make sure them are added.

---

## Quick Implementation Notes

- **When filling Scene Visual Logic:** always reference the specific subsection in **Section 3 Visual Logic & Object Physics Library** (for example `VISUAL LOGIC:  Drones and Aerial Systems - Propeller Effects: Propellers show motion blur, downdraft bends vegetation and lifts dust proportionally to rotor size and altitude; Flight Path: Trajectories are smooth and physically plausible, avoid teleportation or canopy penetration.; `).
- **Checklist before finalizing each scene:** Identity Locking; Single Action Focus; Visual Logic compliance; Multiplicity numbers; Contact Points present; Shadow and reflection consistency.
- **Error Prevention:** add a short “scene QA” step: verify no clipping, no floating objects, consistent shadows, correct contact points, and realistic sensor/telemetry UI behavior.

---
