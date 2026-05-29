# Firmware Files

Place the merged ESP32-C3 factory image here as `firmware.bin`.
Place the app-only update image here as `app.bin`.
Place the update boot files here as `bootloader.bin`, `partitions.bin`, and
`boot_app0.bin`.

The included `manifest.json` flashes that file at offset `0x0`, which is the
right shape for a single merged/factory image used on blank boards or recovery.

The included `manifest-update.json` flashes the boot files and `app.bin` while
avoiding the ESP32 preferences/NVS partition at `0x9000`. Use that for devices
that have already been factory-flashed. It preserves the partition that stores
device name, LED count, segments, scenes, and sync settings when flash is not
erased.

If your build gives you separate binaries, update `manifest.json` with the
actual file names and offsets from your build output. A common ESP32-C3 layout
looks like this:

```json
{
  "name": "ESP32-C3 Firmware",
  "version": "1.0.0",
  "builds": [
    {
      "chipFamily": "ESP32-C3",
      "parts": [
        { "path": "firmware/bootloader.bin", "offset": 0 },
        { "path": "firmware/partition-table.bin", "offset": 32768 },
        { "path": "firmware/boot_app0.bin", "offset": 57344 },
        { "path": "firmware/app.bin", "offset": 65536 }
      ]
    }
  ]
}
```
