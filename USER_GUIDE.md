# LumaLuxeControl User Guide

This guide explains how to configure and operate the LumaLuxe Display firmware for an ESP32-C3 LED display project. It covers the BLE/serial command protocol, segmented layouts, scene controls, sync behavior, and common troubleshooting.

For finished light projects, hardware wiring, power, enclosure, and selling considerations are covered in `IMPLEMENTATION_GUIDE.md`.

## Core Ideas

LumaLuxeControl controls one physical string of addressable LEDs. The physical string can be treated as one whole light, or divided into logical segments. Each segment is a contiguous physical LED range with its own scene, color, speed, direction, brightness, and enabled state.

Current builds and testing assume WS2812B addressable LED strips driven from one ESP32-C3 data line. The firmware is configured for one FastLED output on GPIO 3 with GRB color order.

There is no global segment 0. Segment 0 is just the first segment.

There is no global brightness in segment mode. `BRI` controls the currently selected segment's brightness as a percentage.

The maximum hardware LED count is 300. The default LED count is 40. The maximum active segment count is 8.

Segment brightness is sent and reported as `0-100`. The firmware converts that percentage to a physical FastLED brightness scale using a 5 V / 2800 mA LED power budget, then also enables FastLED's power limiter. This keeps `BRI 100` from meaning raw full-white current on long strips.

Speed is also sent and reported as `0-100`. The firmware maps that percentage to the internal `0-255` animation scale used by scenes.

## Connecting

Commands can be sent over BLE or serial. Serial monitor speed is:

```text
115200
```

Typical PlatformIO monitor command:

```bash
pio device monitor -p /dev/ttyACM1 -b 115200
```

Upload to `/dev/ttyACM1`:

```bash
pio run -e esp32-c3-supermini -t upload --upload-port /dev/ttyACM1
```

Commands are plain text. Most setters return a short confirmation, and state queries return JSON.

For installing PlatformIO, building, uploading, and troubleshooting serial ports, see `BUILD_ENVIRONMENT.md`.

## Persistence

Most configuration commands are saved to ESP32 preferences immediately when the command is handled. There is no separate save command.

These settings survive unplugging or rebooting the box:

```text
NUMLEDS
SEGCOUNT
SEG
SEGMENT
SEGEN
LINKSEGMENTS

SCENE
BRI
SPEED
DIR
BLEND
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
BGHUEDIST
FADE
PARTICLECOUNT
TAILLENGTH

ROLE
SYNCGROUP
ACCEPTSYNC

REN
```

When a slave receives `SYNC`, it persists synced visual scene settings but keeps its own physical LED count and segment layout. `SYNCALL` clones the master's physical LED count and segment layout too.

These settings are runtime-only in the current firmware:

```text
POWER
RGB
```

For example, `POWER 0` turns the lights off now, but the box will not remember that off state after unplugging and plugging back in.

## Basic Commands

```text
GET
GET SEGMENT <index>
POWER <0|1>
NUMLEDS <8-300>
REN <device name>
```

`GET` returns lean global device state. It does not include all segment details.

Example:

```text
GET
```

Typical fields:

```json
{
  "name": "WATERBENDER",
  "power": 1,
  "numLeds": 40,
  "maxLeds": 300,
  "syncRole": 1,
  "syncGroup": 0,
  "acceptSync": 1,
  "linkSegments": 0,
  "segmentCount": 4,
  "currentSegment": 2,
  "maxSegments": 8
}
```

Use `GET SEGMENT <index>` when you need only that segment's active settings:

```text
GET SEGMENT 2
```

Example segment fields:

```json
{
  "index": 2,
  "start": 20,
  "end": 29,
  "length": 10,
  "scene": 9,
  "BRI": 100,
  "SPEED": 50,
  "DIR": 0,
  "HUE": 99,
  "SAT": 255,
  "HUEDIST": 16,
  "BGHUE": 176,
  "BGSAT": 180,
  "BGBRI": 0,
  "BGHUEDIST": 16,
  "FADE": 1,
  "PARTICLECOUNT": 6,
  "TAILLENGTH": 1,
  "SCALE": 0,
  "DENSITY": 0,
  "WIDTH": 0,
  "PHASE": 0,
  "OFFSET": 0,
  "ROTATION": 0,
  "enabled": 1
}
```

`GET SEGMENT <index>` does not change the selected segment. It only reads that segment.

Control values use the same names as their command verbs. Values for controls unsupported by the segment's current scene are returned as `0`. The firmware still keeps the previously stored values internally so switching back to a scene that supports those controls can restore them.

Generic semantic controls use `0-100` values: `SCALE`, `DENSITY`, `WIDTH`, `PHASE`, `OFFSET`, and `ROTATION`. Scenes only show the controls they advertise through `GET SCENE <index>`.

## Segment Setup

Segment indexes are zero-based. If `segmentCount` is 4, the valid segment indexes are:

```text
0, 1, 2, 3
```

`GET SEGMENT 4` will return `ERR BAD_SEGMENT` until you increase the segment count to 5 or more.

### Segment Commands

```text
SEGCOUNT <1-8>
SEG <index> <start> <end>
SEGMENT <index>
SEGEN <index> <0|1>
LINKSEGMENTS <0|1>
```

`SEGCOUNT` sets how many segment slots are active:

```text
SEGCOUNT 4
```

`SEG` sets the physical LED range for one segment:

```text
SEG 2 20 29
```

The UI may expose this as starting LED plus number of LEDs. The command still uses start and end:

```text
end = start + length - 1
```

For example, start `20` and length `10` becomes:

```text
SEG 2 20 29
```

`SEGMENT` selects the segment that normal scene/color/speed commands edit:

```text
SEGMENT 2
```

`SEGEN` enables or disables a segment:

```text
SEGEN 2 1
SEGEN 2 0
```

`LINKSEGMENTS` makes all segments render with segment 0 scene settings while keeping each segment's own start, end, and enabled state:

```text
LINKSEGMENTS 1
```

When linked, normal scene/color/speed commands edit segment 0 even if another segment is selected. `GET SEGMENT <index>` still returns the requested segment's geometry, but its scene/control fields reflect the effective segment 0 settings.

### Simple Four-Segment Lightbox

For a 40 LED lightbox split into four 10 LED ranges:

```text
SEGCOUNT 4

SEG 0 0 9
SEG 1 10 19
SEG 2 20 29
SEG 3 30 39
```

Then set each segment:

```text
SEGMENT 0
SCENE 9
HUE 0
SAT 255
BRI 70

SEGMENT 1
SCENE 9
HUE 80
SAT 255
BRI 70

SEGMENT 2
SCENE 9
HUE 160
SAT 255
BRI 70

SEGMENT 3
SCENE 9
HUE 220
SAT 255
BRI 70
```

## Wiring Advice

Segments are contiguous physical LED ranges. The firmware does not combine multiple physical ranges into one visual segment.

If a visual region crosses LED 0 or the end of the strip, you may need two segments with matching settings. That works well for simple scenes such as `SolidColor`, but motion scenes may restart at the split because each segment renders in its own local LED space.

Practical rule:

```text
Wire the LEDs so the visual regions you care about most are contiguous ranges.
```

If you want top/bottom effects to behave cleanly, wire the top and bottom regions as contiguous ranges. If you want left/right effects to behave cleanly, wire the left and right regions as contiguous ranges.

### Linear Wiring

Linear wiring means LED index increases along one visible path:

```text
0 1 2 3 4 5 6 ...
```

This is the easiest layout for the firmware to reason about. Motion scenes such as `ColorFlow`, `Comets`, `Bubbles`, and `Embers` treat LED order as the direction of travel. If the strip runs bottom-to-top, `DIR 0` usually reads as upward motion. If the strip runs top-to-bottom, use `DIR 1` or reverse the segment start/end in hardware when possible.

Use a single segment for one continuous linear visual region. Split into multiple segments only when you want different scenes or settings on different physical parts.

### Serpentine Wiring

Serpentine wiring folds the strip back and forth:

```text
0  1  2  3  4
9  8  7  6  5
10 11 12 13 14
```

This is convenient for panels, shelves, backlights, and rectangular light boxes because it avoids long return wires. The tradeoff is that LED order changes direction on every row. One-dimensional scenes will follow the wire path, not a perfect left-to-right or bottom-to-top screen coordinate system.

Best practices:

```text
Use serpentine wiring when a flowing path is acceptable.
Use segments for rows, columns, or sides when each should behave independently.
Avoid expecting 2D image-like motion from one long serpentine segment.
```

For a rectangular perimeter, wire each side as a contiguous range if side-specific effects matter. For a filled rectangle, decide whether you want motion to snake through the full panel or whether each row/column should be its own segment.

### Spiral Wiring

Spiral wiring wraps the strip around a cylinder or pole. LED index increases along the physical spiral:

```text
bottom turn -> middle turns -> top turn
```

This is a good match for vertical diffuser tubes and lamps. Scenes that move along LED order become upward or downward motion around the lamp. `Bubbles` and `Embers` are designed to work well with this kind of layout. `Helix` is intended for spiral-wrapped lamps, but it still depends on the physical pitch and LED spacing looking reasonable through the diffuser.

Best practices:

```text
Keep the spiral pitch consistent.
Keep LED spacing consistent around each turn.
Place LED 0 at the end where you want upward scenes to begin.
Use one segment for the whole spiral unless you need independent zones.
```

For a spiral lamp, `NUMLEDS` should match the actual LED count on that device. If two lamps have different LED counts, use `SYNC` to compare the same visual settings while preserving each lamp's physical layout. Use `SYNCALL` only when you intentionally want to clone the physical layout too.

### Light Box Construction

Light boxes can be wired as a perimeter, a flat face, or a filled panel. The best layout depends on what the diffuser is supposed to do.

For a square or rectangular perimeter, wire the bottom, right, top, and left sides as clean contiguous ranges when possible. This makes perimeter effects and `VerticalFade` easier to predict. `VerticalFade` assumes a four-sided box/perimeter and divides the active segment into four equal sides, so uneven side lengths or extra LEDs can make the effect look surprising.

For a flat illuminated face, forward-facing LEDs usually give the most direct brightness and color. They work best when there is enough diffuser distance to hide individual points. If the LEDs are too close to the face, hotspots become obvious.

Side-mounted or inward-facing LEDs can produce a smoother glow because the light bounces inside the box before it reaches the diffuser. This is often better for shallow signs, logos, and soft ambient panels. The tradeoff is lower apparent brightness and more dependence on the interior material.

Useful physical details:

```text
Use a white or reflective interior for smoother mixing.
Increase diffuser distance when hotspots are visible.
Use denser LEDs or lower brightness if individual points show through.
Avoid placing LEDs where caps, seams, or supports cast hard shadows.
Keep wiring and solder joints out of the main optical path.
```

For arbitrary front-facing shapes, wire the most important visual path as one contiguous range. If the shape has separate regions, give each region its own segment. If a region must be split physically, simple color scenes can still match across split segments, but moving scenes will restart at each segment boundary.

### Choosing Segments

Use fewer segments when you want one unified animation. Use more segments when physical regions should have different scenes, colors, or brightness.

Good segment boundaries are physical boundaries:

```text
one side of a box
one shelf
one logo stroke
one diffuser tube
one separate illuminated region
```

Avoid segment boundaries in the middle of a motion path unless the restart is acceptable. `LINKSEGMENTS 1` is useful when several physical segments should share the same scene settings while keeping their own ranges. It does not turn separated ranges into one continuous animation path; each segment still renders in its own local LED space.

## Scene List

```text
0  Demo
1  Sparkles
2  Comets
3  ColorFlow
4  DualFlow
5  TriFlow1
6  TriFlow2
7  TriFlow3
8  ColorCycle
9  SolidColor
10 VerticalFade
11 VerticalFade2
12 ColorBurst
13 Bubbles
14 Embers
15 Helix
```

Use `GET SCENES` to read the scene list. It returns scene IDs and names only.

Use `GET SCENE <index>` to read one scene's supported controls as a flat object:

```text
GET SCENE 13
```

Example scene fields:

```json
{
  "id": 13,
  "name": "Bubbles",
  "SPEED": 1,
  "BRI": 1,
  "DIR": 1,
  "HUE": 1,
  "SAT": 1,
  "HUEDIST": 1,
  "BGHUE": 1,
  "BGSAT": 1,
  "BGHUEDIST": 0,
  "BGBRI": 1,
  "FADE": 1,
  "PARTICLES": 1,
  "PARTICLEMIN": 1,
  "PARTICLEMAX": 12,
  "TAILS": 0,
  "TAILMIN": 0,
  "TAILMAX": 0
}
```

`PARTICLES` and `TAILS` are scene capability flags. The current segment values are returned by `GET SEGMENT <index>` as `PARTICLECOUNT` and `TAILLENGTH`.

Slider-like scene fields include range metadata when useful. For example, scenes that support particles return `PARTICLEMIN` and `PARTICLEMAX`; scenes that support tail length return `TAILMIN` and `TAILMAX`. Unsupported slider ranges return `0`.

Set a scene on the selected segment:

```text
SEGMENT 2
SCENE 9
```

## Color And Brightness

The firmware uses HSV color controls.

Foreground controls:

```text
HUE <0-255>
SAT <0-255>
HUEDIST <0-255>
```

Brightness:

```text
BRI <0-100>
```

`BRI` is per segment. Select the segment first:

```text
SEGMENT 2
BRI 50
```

Background controls, for scenes that support them:

```text
BGHUE <0-255>
BGSAT <0-255>
BGBRI <0-100>
BGHUEDIST <0-255>
```

Generic semantic controls, for scenes that support them:

```text
SCALE <0-100>
DENSITY <0-100>
WIDTH <0-100>
PHASE <0-100>
OFFSET <0-100>
ROTATION <0-100>
```

Important: if `SAT` is 0, changing `HUE` will not be visible because the color is white or gray. For obvious color changes, use:

```text
SAT 255
```

## Direction

Direction uses only two values:

```text
DIR 0
DIR 1
```

Scene labels:

```text
Flow/comet/tri-flow scenes:
DIR 0 = Right
DIR 1 = Left

Vertical fade scenes:
DIR 0 = Up / Bottom-Up
DIR 1 = Down / Top-Down

Generic:
DIR 0 = Forward
DIR 1 = Reverse
```

There is no `DIR 2`, `DIR 3`, center-out, inward, or extra direction mode.

## Scene Controls

### 0 Demo

Demo cycles through scenes 1-12 automatically. Demo uses its own presets, so color commands may be saved but not visibly honored while Demo is active.

Controls:

```text
SPEED
BRI
```

### 1 Sparkles

Controls:

```text
HUE
SAT
BGHUE
BGSAT
BGBRI
BGHUEDIST
SPEED
BRI
```

### 2 Comets

Controls:

```text
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
SPEED
BRI
DIR
PARTICLECOUNT
```

`PARTICLECOUNT` controls how many comet heads are evenly spaced around the active segment.

### 3 ColorFlow

Controls:

```text
HUE
SAT
BGHUE
BGSAT
BGBRI
SPEED
BRI
DIR
```

### 4 DualFlow

Controls:

```text
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
SPEED
BRI
DIR
TAILLENGTH
```

### 5 TriFlow1

Controls:

```text
HUE
SAT
BGHUE
BGSAT
BGBRI
SPEED
BRI
DIR
TAILLENGTH
```

### 6 TriFlow2

Controls:

```text
HUE
SAT
BGHUE
BGSAT
BGBRI
SPEED
BRI
DIR
TAILLENGTH
```

### 7 TriFlow3

Controls:

```text
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
SPEED
BRI
DIR
TAILLENGTH
```

### 8 ColorCycle

Controls:

```text
HUE
SAT
HUEDIST
FADE
SPEED
BRI
```

`FADE 1` smoothly blends between hue steps. `FADE 0` jumps step by step.

### 9 SolidColor

Controls:

```text
HUE
SAT
BRI
```

This is the best scene for testing segment setup because changes are immediate and obvious.

### 10 VerticalFade

Controls:

```text
HUE
SAT
BRI
DIR
```

VerticalFade assumes the active segment is arranged like a four-sided box/perimeter. It divides the segment length by 4 and treats those pieces as bottom, right, top, and left.

If the segment length is not evenly shaped as a mini-box, some LEDs may remain black or the effect may look unintuitive. For a 10 LED segment, `sideLength` becomes `10 / 4 = 2`, so only 8 local LEDs are actively mapped by the vertical fade renderer.

### 11 VerticalFade2

Controls:

```text
HUE
SAT
HUEDIST
BRI
DIR
```

VerticalFade2 is the animated/color-shifting version of VerticalFade. It has the same four-sided box/perimeter assumption.

Current firmware note: the segment stores and syncs `SPEED`, but VerticalFade2 currently animates at the render frame rate rather than using `SPEED`.

### 12 ColorBurst

Controls:

```text
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
FADE
PARTICLECOUNT
SPEED
BRI
```

ColorBurst particles grow from random center points, then pop with a faster fade-out. `PARTICLECOUNT` controls how many bursts can be alive at once. `SPEED` controls spawn rate and lifecycle speed.

Color behavior uses `HUEDIST`: `0` keeps every burst on the selected `HUE`, `1-254` randomizes within that hue distance, and `255` uses fully random hues.

### 13 Bubbles

Controls:

```text
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
FADE
PARTICLECOUNT
SPEED
BRI
DIR
```

Bubbles rise through the segment using LED order as bottom-to-top, which fits a spiral tube where higher LED indexes are physically higher. `PARTICLECOUNT` controls how many bubbles can be alive at once. `SPEED` controls spawn rate and upward velocity.

`DIR 0` rises from bottom to top. `DIR 1` reverses the flow for strips wired top-to-bottom.

Color behavior uses `HUEDIST`: `0` keeps every bubble on the selected `HUE`, `1-254` randomizes within that hue distance, and `255` uses fully random hues.

### 14 Embers

Controls:

```text
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
FADE
SCALE
DENSITY
WIDTH
ROTATION
SPEED
BRI
DIR
```

Embers creates a soft diffuser-style ember volume for vertical strips and spiral lamps. `SCALE` controls glow height as a percentage of the segment. `WIDTH` controls the hot base thickness. `DENSITY` controls bright ember flecks. `ROTATION` controls how much spiral shimmer appears. `SPEED` controls flicker. `HUEDIST` shifts cooler embers away from the selected `HUE`.

`DIR 0` rises from bottom to top. `DIR 1` reverses the source to the top.

### 15 Helix

Controls:

```text
HUE
SAT
HUEDIST
BGHUE
BGSAT
BGBRI
SCALE
WIDTH
ROTATION
SPEED
BRI
DIR
```

Helix draws a rotating ribbon for spiral-wrapped lamps. `WIDTH` controls ribbon thickness, `ROTATION` controls twist, and `SCALE` controls ribbon coverage/intensity. `HUEDIST` shifts hue along the lamp height.

`DIR 0` rotates forward. `DIR 1` reverses rotation.

## Sync

Sync uses ESP-NOW. Devices are grouped by sync group.

Roles:

```text
ROLE 0 = standalone
ROLE 1 = master
ROLE 2 = slave
```

Commands:

```text
SYNCGROUP <0-255>
ACCEPTSYNC <0|1>
SYNC
SYNCALL
```

Master example:

```text
ROLE 1
SYNCGROUP 0
SYNC
```

Slave example:

```text
ROLE 2
SYNCGROUP 0
ACCEPTSYNC 1
```

When a master sends `SYNC`, it broadcasts visual playback settings:

```text
power
link segments
scene
BRI
SPEED
DIR
foreground HSV settings
background HSV settings
fade
particle count
tail length
scale
density
width
phase
offset
rotation
```

`SYNC` applies those visual settings to the slave's existing segments and keeps:

```text
hardware LED count
segment count
segment start/end
segment enabled state
```

`SYNCALL` clones the master's display layout too:

```text
hardware LED count
segment count
current segment
segment start/end
segment enabled state
all visual settings
```

Neither command syncs device name, role, group, or accept-sync settings.

Both master and slave should run firmware with the same sync packet version. Current sync packet version is 9.

## Common Workflows

### Set One Segment To A Solid Color

```text
SEGMENT 2
SEGEN 2 1
SCENE 9
SAT 255
BRI 70
HUE 99
```

### Add A Fifth Segment

If `segmentCount` is 4, valid indexes are 0-3. To use segment 4:

```text
SEGCOUNT 5
SEG 4 40 49
SEGEN 4 1
SEGMENT 4
SCENE 9
```

### Read One Segment Without Selecting It

```text
GET SEGMENT 3
```

This returns segment 3 details but does not change `currentSegment`.

### Select A Segment Before Editing It

```text
SEGMENT 3
HUE 44
BRI 100
```

Commands such as `HUE`, `SAT`, `SCENE`, `BRI`, `SPEED`, `DIR`, and `TAILLENGTH` apply to the currently selected segment.

### Temporarily Isolate A Segment

This helps debug overlap or unexpected ranges:

```text
SEGEN 0 0
SEGEN 1 0
SEGEN 2 1
SEGEN 3 0
SEGEN 4 0
SEGEN 5 0
SEGEN 6 0
SEGEN 7 0

SEGMENT 2
SCENE 9
SAT 255
BRI 100
HUE 99
```

Only valid active segment indexes can be enabled or disabled. If `segmentCount` is 4, indexes 4-7 are not active yet.

## Troubleshooting

### `ERR BAD_SEGMENT`

The requested segment index is outside the active segment count.

Example:

```text
segmentCount = 4
valid indexes = 0, 1, 2, 3
GET SEGMENT 4 = ERR BAD_SEGMENT
```

Fix:

```text
SEGCOUNT 5
```

### Hue Changes Do Not Show

Check saturation:

```text
GET SEGMENT <index>
```

If saturation is 0, hue changes will look white or gray. Set:

```text
SAT 255
```

Also make sure the segment is not in Demo:

```text
SCENE 9
```

### Segment Does Not Change

Check:

```text
GET SEGMENT <index>
```

Look for:

```text
enabled = 1
scene is what you expect
BRI is not 0
SAT is not 0 for color tests
start/end/length point to real LEDs
```

Also check whether a later segment overlaps and paints over it. Segments render in index order, so segment 3 paints after segment 2.

### ColorCycle Brightness Looks Wrong

Current firmware applies brightness per segment when copying rendered segment output into the physical LED buffer. If ColorCycle ignores brightness, make sure the firmware includes the per-segment brightness fix and has been uploaded to the device.

### VerticalFade Lights Fewer LEDs Than Expected

VerticalFade and VerticalFade2 assume the active segment is a four-sided box/perimeter. They use:

```text
sideLength = segmentLength / 4
```

If segment length is 10, sideLength is 2 and only 8 LEDs are mapped by the four-sided renderer.

### Motion Scenes Restart At A Visual Split

Each segment renders as its own local LED space starting at local LED 0. If one visual region is represented by two physical segments, flow/comet/fade scenes will restart at the split.

This is expected. Wire the LEDs so important visual regions are contiguous whenever possible.

## Quick Command Reference

```text
GET
GET SEGMENT <index>

POWER <0|1>
NUMLEDS <8-300>
REN <device name>

SEGCOUNT <1-8>
SEG <index> <start> <end>
SEGMENT <index>
SEGEN <index> <0|1>

SCENE <0-15>
HUE <0-255>
SAT <0-255>
BRI <0-100>
HUEDIST <0-255>
BGHUE <0-255>
BGSAT <0-255>
BGBRI <0-100>
BGHUEDIST <0-255>
DIR <0|1>
SPEED <0-100>
TAILLENGTH <value>
FADE <0|1>
PARTICLECOUNT <1-12>
SCALE <0-100>
DENSITY <0-100>
WIDTH <0-100>
PHASE <0-100>
OFFSET <0-100>
ROTATION <0-100>

ROLE <0|1|2>
SYNCGROUP <0-255>
ACCEPTSYNC <0|1>
SYNC
SYNCALL
```

Unsupported palette commands:

```text
PAL
NEXTPAL
PREVPAL
```
