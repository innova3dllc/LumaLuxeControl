# ESP32 Web Flashing Guide

This guide is for flashing a prebuilt LumaLuxeControl firmware file onto an ESP32-C3 device without installing PlatformIO or the Arduino IDE.

Use the build environment guide only if you want to compile firmware yourself. For normal users, use the hosted LumaLuxeControl web flasher.

For finished light projects, hardware wiring, power, enclosure, and selling considerations are covered in `IMPLEMENTATION_GUIDE.md`.

When publishing firmware files, include `LICENSE` and `THIRD_PARTY_LICENSES.md` in the release package.

## Hardware Target

Current builds and testing assume WS2812B addressable LED strips driven from one ESP32-C3 data pin. The firmware is configured for a single FastLED output on GPIO 3 with GRB color order.

Other addressable LED chipsets or multi-output wiring may require firmware changes and should be treated as untested unless explicitly documented.

## Browser Requirements

Use a desktop browser that supports Web Serial:

```text
Google Chrome
Microsoft Edge
```

Firefox, Safari, and iOS browsers are not reliable choices for browser flashing.

## Recommended Web Flasher

LumaLuxeControl hosted installer:

```text
https://thetazzbot.github.io/LumaLuxeControl/
```

This page uses ESP Web Tools with two paths:

```text
Install / reset: docs/firmware/firmware.bin at offset 0
Update firmware: bootloader/partitions/boot_app0 plus docs/firmware/app.bin at offset 0x10000
```

Use install/reset for blank boards or recovery. Use update only for devices
that have already been factory-flashed with LumaLuxeControl.

Manual fallback flasher:

```text
https://espflash.app/
```

ESPFlash runs directly in Chrome/Edge and accepts a complete merged/factory `.bin` file if you need to flash a downloaded release manually.

ESP Web Tools project/documentation:

```text
https://esphome.github.io/esp-web-tools/
```

ESP Web Tools powers the hosted LumaLuxeControl installer.

## Firmware File Type

For web flashing, publish a complete merged/factory firmware image.

Do not publish only this file for web flasher users:

```text
.pio/build/esp32-c3-supermini/firmware.bin
```

That file is only the application image. It does not include the bootloader, partition table, or boot app block.

Publish a merged/factory `.bin` that contains:

```text
bootloader
partition table
boot_app0
firmware application
```

## Suggested File Naming

Use a filename that clearly identifies the product, board family, version, and that the file is a merged factory image.

Suggested convention:

```text
lumaluxecontrol-esp32c3-supermini-vYYYY.MM.DD-<shortsha>-factory.bin
```

Example:

```text
lumaluxecontrol-esp32c3-supermini-v2026.05.20-a1b2c3d-factory.bin
```

If we later add formal semantic versions, use:

```text
lumaluxecontrol-esp32c3-supermini-v1.2.0-factory.bin
```

Avoid vague names such as:

```text
firmware.bin
latest.bin
esp32.bin
```

Those names make it too easy to flash the wrong board or old firmware.

## Creating The Factory Bin

The project includes a release build script that creates the merged factory image and copies deployment documentation into a versioned folder under `release/`:

```bash
./release/build_release.sh
```

The output package is named with this pattern:

```text
release/lumaluxecontrol-esp32c3-supermini-vYYYY.MM.DD-<shortsha>/
```

That package contains the factory `.bin`, project license, flashing guide, user guide, implementation guide, third-party license notices, and a release manifest. It does not include `src/` or `include/`.

You can override the version string:

```bash
VERSION="1.2.0" ./release/build_release.sh
```

Manual steps are below for reference.

First build the firmware:

```bash
pio run -e esp32-c3-supermini
```

Create a release folder:

```bash
mkdir -p release
```

Set a version string:

```bash
VERSION="$(date +%Y.%m.%d)-$(git rev-parse --short HEAD)"
```

Merge the ESP32-C3 flash parts into one factory image:

```bash
python ~/.platformio/packages/tool-esptoolpy/esptool.py \
  --chip esp32c3 merge_bin \
  -o "release/lumaluxecontrol-esp32c3-supermini-v${VERSION}-factory.bin" \
  --flash_mode dio \
  --flash_freq 80m \
  --flash_size 4MB \
  0x0000 .pio/build/esp32-c3-supermini/bootloader.bin \
  0x8000 .pio/build/esp32-c3-supermini/partitions.bin \
  0xe000 ~/.platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin \
  0x10000 .pio/build/esp32-c3-supermini/firmware.bin
```

The important offsets for this project are:

```text
0x0000   bootloader.bin
0x8000   partitions.bin
0xe000   boot_app0.bin
0x10000  firmware.bin
```

These match the PlatformIO upload command for the current ESP32-C3 configuration.

## Flashing With LumaLuxeControl Web Flasher

1. Open:

```text
https://thetazzbot.github.io/LumaLuxeControl/
```

2. Connect the ESP32-C3 to the computer over USB.

3. Click the install/connect button on the page.

4. Select the ESP32 serial port.

5. Follow the prompts to flash the published firmware.

6. Wait for the flash operation to finish.

7. Disconnect/reconnect or reset the ESP32.

8. Open the app or BLE scanner and look for the LumaLuxe device name.

## Flashing With ESPFlash Manually

Use this fallback when you need to flash a downloaded release package instead of the hosted installer.

1. Open:

```text
https://espflash.app/
```

2. Connect the ESP32-C3 to the computer over USB.

3. Click `Connect Device`.

4. Select the ESP32 serial port.

5. Choose the published factory image from the release package:

```text
lumaluxecontrol-esp32c3-supermini-vYYYY.MM.DD-<shortsha>-factory.bin
```

6. Start flashing.

7. Wait for the flash operation to finish.

8. Disconnect/reconnect or reset the ESP32.

9. Open the app or BLE scanner and look for the LumaLuxe device name.

## Boot Button Notes

Most ESP32-C3 boards enter flashing mode automatically. If the flasher cannot connect:

```text
Hold BOOT
Tap RESET while still holding BOOT
Release BOOT after the flasher starts connecting
```

Some boards label these buttons differently.

## After Flashing

The device should advertise over BLE using its saved or default device name.

If this is a fresh device, expected defaults include:

```text
name: LumaLuxe Display
numLeds: 40
segmentCount: 1
scene: Demo
```

If the device had previous settings stored in ESP32 preferences, the update
flow preserves those settings. Use the app or serial commands to adjust
`NUMLEDS`, segments, and name after flashing.

## Fresh Install Versus Update

The hosted flasher has two actions.

Use `Install / reset` for a blank board, recovery, or a device that should be
returned to a clean factory setup. It writes the merged factory image at offset
`0` and can erase saved preferences.

Use `Update firmware` for a device that already runs LumaLuxeControl. It writes
the bootloader, partition table, boot_app0 image, and app image, but leaves the
NVS preferences partition at `0x9000` untouched. That preserves saved name, LED
count, segments, scenes, and sync settings when flash is not erased.

Use erase with care:

```text
Erase removes saved name, LED count, segments, scenes, sync settings, and all preferences.
```

## Hosted Web Flasher Manifest

ESP Web Tools is embedded into the hosted HTTPS page with an install button. It uses a manifest that points at one or more firmware files.

For a merged/factory ESP32-C3 image, the manifest should install the file at offset `0`:

```json
{
  "name": "LumaLuxeControl",
  "version": "2026.05.20",
  "new_install_prompt_erase": true,
  "builds": [
    {
      "chipFamily": "ESP32-C3",
      "parts": [
        {
          "path": "docs/firmware/firmware.bin",
          "offset": 0
        }
      ]
    }
  ]
}
```

For a preference-preserving update, the manifest should install the boot pieces
and app while avoiding the NVS preferences partition at `0x9000`. It should not
request erase:

```json
{
  "name": "LumaLuxeControl Firmware Update",
  "version": "2026.05.20",
  "builds": [
    {
      "chipFamily": "ESP32-C3",
      "parts": [
        {
          "path": "docs/firmware/bootloader.bin",
          "offset": 0
        },
        {
          "path": "docs/firmware/partitions.bin",
          "offset": 32768
        },
        {
          "path": "docs/firmware/boot_app0.bin",
          "offset": 57344
        },
        {
          "path": "docs/firmware/app.bin",
          "offset": 65536
        }
      ]
    }
  ]
}
```

The hosting page must be served over HTTPS because Web Serial requires a secure context.

## Troubleshooting

### The Browser Cannot See The Device

Try:

```text
Use Chrome or Edge on desktop.
Close PlatformIO serial monitor.
Close Arduino Serial Monitor.
Unplug/replug the ESP32.
Try another USB cable.
Try another USB port.
Avoid USB hubs.
```

### Flashing Fails Immediately

Try bootloader mode:

```text
Hold BOOT
Tap RESET
Release BOOT after connection begins
```

Also make sure the selected file is the factory/merged `.bin`, not PlatformIO's application-only `firmware.bin`.

### Device Flashes But Does Not Advertise

Check:

```text
Correct ESP32-C3 firmware file
Correct board type
USB power is stable
Device was reset after flashing
BLE scanner/app has refreshed its device list
```

### Settings Look Old After Flashing

That can be normal. Firmware updates may preserve saved ESP32 preferences.

Use commands or the app to reset/update:

```text
REN <name>
NUMLEDS <count>
SEGCOUNT <count>
SEG <index> <start> <end>
SCENE <index>
```

For a fully clean install, erase flash before flashing, or use a hosted web flasher flow that prompts for erase.
