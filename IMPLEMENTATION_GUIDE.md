# LumaLuxeControl Implementation Guide

This guide is for builders using LumaLuxeControl in finished light projects such as lightboxes, signs, lamps, displays, and small-batch products.

It focuses on practical implementation decisions: controller choice, LED wiring, power, enclosure safety, firmware setup, and customer-facing reliability.

This is not legal, regulatory, or certification advice. If you sell finished products, you are responsible for checking the rules that apply to your market and product category.

## Project Positioning

LumaLuxeControl is not trying to be a full WLED replacement or compete with WLED-ready dev boards. Those boards are a better fit when a project needs the full WLED ecosystem, Wi-Fi networking, many configuration options, level shifting, power terminals, fusing, or a more complete controller board.

The goal of this project is narrower: reduce or eliminate the Wi-Fi and implementation friction that can make WLED feel heavy for simple lightboxes and small sellable projects.

This project favors:

```text
low-cost ESP32-C3 hardware
one WS2812B data output
BLE and serial setup instead of Wi-Fi setup
simple scene controls
repeatable defaults for makers
master/slave sync without network configuration
```

The result is intentionally less universal than WLED, but easier to package into a simple product when the customer just needs the light to work.

## Target Use Case

The current project is aimed at affordable DIY light projects built around:

```text
ESP32-C3 controller
WS2812B addressable LED strip
one LED data line
5 V LED power
USB-C for firmware flashing and/or controller power
BLE app or serial command setup
```

The ESP32-C3 was chosen because it is low cost while still providing BLE, ESP-NOW sync, serial configuration, and enough performance for the current scene engine.

This makes it a good fit for makers who want something more flexible than a basic imported RF remote controller, while keeping the bill of materials low.

## ESP32-C3 Versus Basic RF Controllers

Low-cost RF LED controllers are attractive because they are simple, cheap, and familiar. A typical 15-key RF controller can be very inexpensive when sourced in bulk through Alibaba-style purchasing, but many small builders buy parts through Amazon, eBay, Etsy suppliers, or small retail channels where the same class of controller may cost closer to $10 per unit.

At those small-builder prices, the ESP32-C3 approach can be less expensive while also giving the builder custom scenes, BLE setup, and sync. That leaves more margin in the finished product instead of spending it on a generic controller and remote.

The RF controller still makes sense when all the product needs is a few fixed colors or simple effects and the builder wants the least possible support burden.

LumaLuxeControl on ESP32-C3 makes sense when the project benefits from:

```text
custom scenes
BLE/app configuration
segment layouts
device naming
master/slave sync
firmware updates
project-specific behavior
```

The tradeoff is that ESP32-C3 products need more care around firmware versioning, support, sourcing, RF compliance, and power integrity.

## Hardware Assumptions

The distributed firmware build assumes:

```text
LED type: WS2812B
LED voltage: 5 V
data outputs: 1
data pin: GPIO 3
color order: GRB
controller: ESP32-C3
maximum configured LEDs: 300
```

Other LED chipsets, different data pins, different color orders, or multiple data outputs are outside the supported implementation described by this guide.

## Recommended Product Architecture

For a small finished lightbox, a practical architecture is:

```text
listed 5 V power supply
USB power input or 5 V input leads
5 V and GND from the input to the LED strip
5 V and GND from the LED power path to the ESP32-C3 board, if supported by the board
ESP32-C3 GPIO 3 to LED data input
common ground between ESP32-C3 and LED strip
bulk capacitor near LED strip power input
data resistor near the controller
strain relief for incoming power and USB leads
```

For anything sold to a customer, prefer a reputable listed external power supply rather than an unknown bare AC/DC supply inside the enclosure.

### Power Wiring Patterns

The current bench setup is:

```text
desktop PC USB port -> ESP32-C3 USB-C
ESP32-C3 5 V and GND pins -> LED strip 5 V and GND
ESP32-C3 GPIO 3 -> LED strip data
```

That can work for development and short runs when brightness is limited. It is simple and convenient, but the LED current is flowing through the USB cable, connector, and board power path before it reaches the strip.

The preferred product wiring is:

```text
5 V supply or USB power input -> LED strip 5 V and GND
same 5 V and GND power path -> ESP32-C3 5 V/VBUS and GND pins
ESP32-C3 GPIO 3 -> LED strip data
```

This makes the LED strip the primary power load and lets the ESP32-C3 ride on the same 5 V supply, instead of using the ESP32-C3 board as the high-current feed-through path. Confirm the specific board supports being powered from its 5 V/VBUS pin before using this layout.

### Bulk Capacitor

A bulk capacitor near the LED strip power input helps absorb short current spikes when many LEDs change brightness at once. It can reduce voltage dips, flicker, random colors, first-pixel glitches, or controller resets caused by noisy 5 V power.

Suggested part:

```text
470 uF to 1000 uF electrolytic capacitor
10 V or 16 V rating preferred
connect across LED +5 V and GND
place near where power enters the LED strip
observe polarity
```

Use `1000 uF` as the easy default when there is room. A ceramic capacitor is fine for small high-frequency noise, but it does not replace the bulk electrolytic for LED strip power surges.

For very small, short-wire test builds, the strip may work fine without a bulk capacitor. It becomes more worth adding when:

```text
the strip is more than about 2-3 ft at 60 LED/m
the build has 40 or more LEDs
power or ground wires are long
the power supply is near its current limit
brightness is high
white-heavy scenes are used
you see flicker, random colors, or resets
the product is being sold to a customer
```

## Power Budget

WS2812B strips can draw much more current than people expect. For customer products, a 5 V 3 A supply should be treated as the practical safe bottom, not a generous supply.

A rough worst-case estimate is:

```text
60 mA per LED at full white
```

Examples:

```text
40 LEDs  ~= 2.4 A worst case
100 LEDs ~= 6.0 A worst case
300 LEDs ~= 18.0 A worst case
```

For a common 60 LED/m strip:

```text
60 LEDs per meter
about 18 LEDs per foot
about 1.08 A per foot at worst-case full white
about 3.6 A per meter at worst-case full white
```

That means a 5 V 3 A supply is already near its practical limit with roughly 2.5-3 ft of 60 LED/m strip at full white. Animated scenes and lower brightness usually draw much less, but product design should not depend on every scene always being gentle.

Example strip lengths at 60 LED/m:

```text
1 ft   ~= 18 LEDs  ~= 1.1 A worst case
2 ft   ~= 37 LEDs  ~= 2.2 A worst case
3 ft   ~= 55 LEDs  ~= 3.3 A worst case
1 m    =  60 LEDs  ~= 3.6 A worst case
132 LEDs          ~= 7.9 A worst case
```

If a 5 V supply gets warm on a 132 LED lamp, that is a sign the supply is undersized, inefficient, poorly ventilated, or being run too close to its rating. Move to a higher-current listed supply with headroom and make sure the wiring, connectors, and enclosure can handle the current too.

### USB Power During Testing

During development, plugging the ESP32-C3 into a desktop PC USB port can work fine, especially because the normal scenes usually do not hit sustained full white. This is acceptable for bench testing when brightness is limited and you are watching the hardware.

Do not treat a successful USB test as proof that the finished lightbox has enough power margin. USB ports, cables, and ESP32-C3 board regulators vary, and a customer may select brighter scenes, white-heavy colors, or settings that draw more current than your test pattern.

For sold products, size the 5 V supply and LED power wiring for the installed LED count, not just for the typical animation you expect people to use.

The firmware includes brightness limiting based on a 5 V / 2800 mA budget, but the physical product should still be wired as if faults and configuration mistakes can happen.

Good practice:

```text
Use 5 V 3 A as the minimum supply size for small builds.
Use a larger supply when LED count or brightness demands it.
Avoid running a supply continuously at its maximum rating.
Use wire sized for the expected current.
Inject power on longer strips when needed.
Avoid sending high LED current through breadboard jumpers or weak connectors.
Consider a fuse or polyfuse on the LED power path.
Keep high-current wiring mechanically secure.
```

## Data Signal Reliability

ESP32-C3 outputs 3.3 V logic. Many WS2812B strips work with a 3.3 V data signal in short test wiring, but it can become marginal in real products.

For short runs, direct GPIO 3 to the LED strip data input is the simplest build and is often good enough. This is a reasonable low-cost implementation choice when the controller is close to the first LED, the ground is solid, and the exact build has been tested.

Risk increases with:

```text
long data wires
noisy power
high LED current
5 V LED supply near the high end
different strip batches
poor grounding
```

For customer products, consider:

```text
small series resistor on the data line, often 220-470 ohms
common ground between controller and LEDs
bulk capacitor near LED power input
short data lead from controller to first LED
74AHCT or 74HCT level shifter for data when reliability margin is needed
```

The level shifter adds parts and build complexity, so it is not always the right default for a low-cost lightbox. A practical approach is "direct data works until it does not": start with direct GPIO 3 for short, controlled builds, then add a level shifter if you see flicker, random colors, first-pixel issues, long data leads, batch sensitivity, or customer reliability problems.

If you omit a level shifter, validate the exact strip, wire length, supply, and enclosure layout you plan to sell.

## ESP32-C3 Board Sourcing

Very low-cost ESP32-C3 boards can be excellent for prototyping, but small-batch products need consistency.

Watch for supplier changes in:

```text
voltage regulator
USB-C connector quality
USB serial behavior
flash size
antenna layout
button labels
pin labels
board dimensions
boot behavior
```

For repeat builds, lock down a known board version and keep a few samples from each batch for regression testing.

If the finished product uses BLE or ESP-NOW, prefer boards or modules with clear RF certification paperwork from a traceable supplier.

## Enclosure And Mechanical Details

Most failures in small light products are physical, not firmware.

Pay attention to:

```text
strain relief on USB and power cables
secure mounting for the ESP32-C3 board
no exposed conductors that can short
no solder joints under mechanical stress
wire routing away from sharp acrylic or metal edges
adequate airflow or thermal margin
diffuser distance to avoid hotspots
service access if firmware updates are expected
```

If the enclosure is wood, acrylic, 3D printed plastic, or foam-core, be conservative with LED brightness and heat. Do not let LED strips, regulators, or wiring run hot against combustible or soft materials.

### Current Lightbox Layout

The current tested lightbox layout uses LED strip cut to about 27 inches, arranged as a square on the 3D-printed back cover.

With common 60 LED/m WS2812B strip, 27 inches is roughly:

```text
27 in = 2.25 ft
about 40 LEDs
about 2.4 A worst case at full white
```

Because the normal scenes are animated and generally do not hold sustained full white, this layout is not expected to create excessive heat when brightness is kept reasonable and the strip is mounted cleanly.

PLA or similar common 3D-print material may be acceptable for this kind of low-power lightbox back cover after testing. If heat, softening, odor, warping, or customer environment becomes a concern, move to a more temperature-tolerant material such as PETG, ABS, or ASA. Those materials add print complexity and may be overkill for the current 27 inch square layout, but they are useful fallback options.

Validate the actual product by running the intended scenes at the intended brightness, then checking the back cover, LED strip, wiring, and power supply after the light has been on for a realistic amount of time.

## Customer Setup Defaults

For a simple customer-ready lightbox, set sane defaults before delivery:

```text
REN <customer or product name>
NUMLEDS <actual LED count>
SEGCOUNT <number of intended segments>
SEG <index> <start> <end>
SCENE <default scene>
BRI <comfortable brightness>
ROLE 0
ACCEPTSYNC 1
```

If the product should be controlled only as one continuous light, use one segment.

If the product has visible physical regions, configure each region as a segment and test every scene the customer is expected to use.

## Sync Products

For multi-light installations:

```text
ROLE 1        master
ROLE 2        slave
SYNCGROUP n   shared group number
SYNC          sync visual settings only
SYNCALL       clone layout and visual settings
```

Use `SYNC` when devices have different LED counts or physical layouts.

Use `SYNCALL` only when the target devices are intended to share the same segment layout and LED count.

In Demo mode, the master broadcasts scene changes so slaves follow the master rather than drifting on their own timers.

## Firmware Release Practice

For products sold to customers, do not ship random firmware files without tracking what version was installed.

Recommended practice:

```text
Use a known release/factory .bin.
Save a copy of the .bin used for that batch.
Record firmware version/date in your production notes.
Flash and test one sample before batch flashing.
Keep one retained sample from each batch if possible.
```

Use `ESP32_FLASHING_GUIDE.md` for flashing factory images. Include `LICENSE` and `THIRD_PARTY_LICENSES.md` with firmware release packages and customer-facing documentation.

## Regulatory And Safety Notes

Selling a finished lightbox is different from building one for personal use.

Topics to check before selling include:

```text
radio/RF authorization for BLE/Wi-Fi capable products
electrical safety of the finished product
power supply listing and labeling
flammability and heat inside the enclosure
button/coin battery rules if bundling a remote
marketplace requirements
instructions and warnings for customers
```

Useful starting points:

```text
FCC radio-frequency device rules:
https://www.fcc.gov/oet/ea/rfdevice

CPSC business testing and certification:
https://www.cpsc.gov/Business--Manufacturing/Testing-Certification/

CPSC button cell and coin battery guidance:
https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Button-Cell-and-Coin-Battery

UL lighting safety overview:
https://www.ul.com/industries/products-and-components/lighting/lighting-safety-testing-and-certification
```

Using an ESP32-C3 can avoid the coin-cell remote that many cheap RF controllers include, but it introduces BLE/RF considerations. Using a cheap RF remote may feel simpler, but the remote battery and RF transmitter still have compliance and safety implications.

## Pre-Delivery Checklist

Before handing a light project to a customer:

```text
Confirm LED count is correct.
Confirm all segments cover the intended LEDs.
Run Demo for several full cycles.
Test SolidColor at red, green, blue, and white.
Test expected brightness for heat.
Power-cycle and confirm settings persist.
Confirm BLE name is correct.
Confirm USB/power cables are strain relieved.
Inspect solder joints and connectors.
Check there are no exposed shorts.
Confirm the power supply is appropriate for the product.
Record firmware build/version.
```

## Practical Recommendation

For this project, ESP32-C3 is a good low-cost controller choice when the product value comes from custom behavior, BLE setup, sync, and scenes.

For the lowest-support product, a basic RF controller may still win. For a more differentiated product that makers can configure and update, ESP32-C3 is the stronger platform.

The main rule is simple: keep the controller cheap, but do not make the power path, wiring, or enclosure cheap in ways that create customer failures.
