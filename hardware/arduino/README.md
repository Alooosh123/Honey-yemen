# Arduino Uno firmware

Upload `HoneyYemenDevice.ino` to the Arduino Uno.

## Libraries

Install through Arduino Library Manager:

- Adafruit TCS34725
- Adafruit MLX90614 Library
- Adafruit BusIO (dependency, normally installed automatically)

## Wiring

| Module | Arduino Uno |
|---|---|
| TCS34725 SDA | A4 / SDA |
| TCS34725 SCL | A5 / SCL |
| MLX90614 SDA | A4 / SDA |
| MLX90614 SCL | A5 / SCL |
| GY-ML8511 analog OUT | A0 |
| Common I2C power and ground | Use module-rated voltage and common ground |

The two I2C modules share the bus. Verify that their addresses do not conflict and that
the modules are supplied within their own voltage limits. Do not connect a 3.3 V module
output to a 5 V pull-up bus unless the breakout board is level-shifted.

## Serial operation

- Baud: 9600.
- Host sends `START\n`.
- Firmware emits `COLOR_DATA,R,G,B`, `UV_DATA,raw_adc`, and `IR_DATA,temp_C`.
- The firmware then emits `SCAN_COMPLETE`.

The firmware averages several readings. UV is deliberately an ADC count (0–1023 on Uno),
not a wavelength, absorbance or HMF concentration. No lamp relay or high-current LED is
switched by this initial firmware: use a properly rated transistor/MOSFET driver and verify
the real wiring/polarity before adding automated light control.

## Before first sample

1. Upload firmware and open Serial Monitor at 9600 baud.
2. Confirm `HONEY_YEMEN_DEVICE_READY` appears and there are no `SENSOR_WARNING` lines.
3. Send `START` and check all three data records.
4. Close Serial Monitor before starting the backend because only one program can own COM.
5. Configure `HONEY_SERIAL_PORT` in `backend/.env` and use the actual COM number.
6. Run a blank/reference check and record calibration conditions before interpreting readings.

This firmware only acquires raw RGB, UV ADC and IR object temperature. It does not classify
honey or calculate chemical composition.
