# Firmware Files

Place your merged ESP32-C3 firmware image here as `firmware.bin`.

The included `manifest.json` flashes that file at offset `0x0`, which is the
right shape for a single merged/factory image.

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
