# Third-Party Software Notices

This document lists third-party software used by the LumaLuxeControl firmware build.

This is a practical notices file for firmware releases and product documentation. It is not legal advice. Before selling at scale, review the exact release package and dependency versions.

## Release Package Recommendation

When distributing a LumaLuxeControl factory firmware `.bin`, include this file alongside the firmware image and user documentation.

Recommended release package contents:

```text
LumaLuxeControl factory firmware .bin
LICENSE
ESP32_FLASHING_GUIDE.md
USER_GUIDE.md
IMPLEMENTATION_GUIDE.md
THIRD_PARTY_LICENSES.md
```

If a release changes dependency versions, update this file before publishing that release.

## Dependency Summary

The current PlatformIO build uses these direct firmware libraries/frameworks:

```text
FastLED 3.10.3
License: MIT
Source: https://github.com/FastLED/FastLED

Arduino-ESP32 framework 3.3.8
License: LGPL-2.1-or-later
Source: https://github.com/espressif/arduino-esp32

ESP-IDF components bundled through Arduino-ESP32
License: mostly Apache-2.0, with third-party components under compatible open-source licenses
Source: https://github.com/espressif/esp-idf
```

Build tools such as PlatformIO, esptool, and the compiler toolchain are used to create the firmware but are not intentionally redistributed as part of the firmware image.

## Project License

LumaLuxeControl firmware source and project-authored documentation are licensed under the GNU General Public License version 3.0. See `LICENSE` for the complete GPLv3 license text.

## Practical Compliance Notes

FastLED's MIT license allows commercial and closed-source use, provided the copyright and license notice are included with copies or substantial portions of the software.

Arduino-ESP32 is listed by the PlatformIO package as `LGPL-2.1-or-later`. LGPL can create additional obligations when distributing compiled firmware, especially around notices, library modifications, and user rights related to the LGPL-covered library portions.

For firmware distribution, keep `LICENSE` and this notices file with every firmware release and avoid modifying third-party library/framework code unless you are prepared to track and publish those modifications as required by the relevant license.

## FastLED

Project: FastLED

Version in current build: 3.10.3

License: MIT

Source: https://github.com/FastLED/FastLED

Local license file used for this notice:

```text
.pio/libdeps/esp32-c3-supermini/FastLED/LICENSE
```

License text:

```text
The MIT License (MIT)

Copyright (c) 2013 FastLED

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Arduino-ESP32 Framework

Project: Arduino-ESP32 framework for Espressif ESP32-family SoCs

Version in current PlatformIO package: 3.3.8

Package license metadata: LGPL-2.1-or-later

Source: https://github.com/espressif/arduino-esp32

Local package metadata used for this notice:

```text
~/.platformio/packages/framework-arduinoespressif32/package.json
```

Important note:

```text
The package metadata lists this framework as LGPL-2.1-or-later.
Review LGPL obligations for the exact release package. Avoid modifying
framework/library files unless those changes are tracked and made available
as required by the applicable license.
```

The GNU Lesser General Public License 2.1 text should be included with firmware release packages that distribute binaries built with this framework. A copy is available from the Free Software Foundation:

```text
https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
```

On many Linux development systems, the same license text is available locally at:

```text
/usr/share/common-licenses/LGPL-2.1
```

## ESP-IDF And Bundled Components

Project: ESP-IDF components bundled through Arduino-ESP32

License summary: mostly Apache-2.0, with third-party components under compatible open-source licenses

Source: https://github.com/espressif/esp-idf

Espressif's ESP-IDF licensing overview states that the majority of ESP-IDF components are available under Apache-2.0 and that third-party components are available under compatible permissive licenses.

Because this firmware is built through Arduino-ESP32 rather than directly distributing an ESP-IDF source tree, this notices file tracks the top-level framework package and the direct libraries used by this project. For production releases, keep the PlatformIO dependency versions recorded so the exact framework package can be reconstructed if needed.

## libb64

Project: libb64, bundled inside the Arduino-ESP32 framework package

License: public domain dedication/certification

Local license file used for this notice:

```text
~/.platformio/packages/framework-arduinoespressif32/cores/esp32/libb64/LICENSE
```

Notice:

```text
Copyright-Only Dedication (based on United States law)
or Public Domain Certification

The person or persons who have associated work with this document certifies,
to the best of his knowledge, the work of authorship is in the public domain,
or dedicates whatever copyright the dedicator holds in the work to the public
domain.
```

## Documentation Credit Snippet

Short attribution suitable for user-facing docs:

```text
LumaLuxeControl firmware uses FastLED and the Arduino-ESP32
framework. See THIRD_PARTY_LICENSES.md for third-party license notices.
```
