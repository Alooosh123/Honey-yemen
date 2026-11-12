# Arduino hardware connection

The production acquisition adapter in this repository uses a real USB serial connection.
It does not generate substitute readings.

## Supported sensor set

- TCS34725: raw red, green and blue counts over I2C.
- GY-ML8511: raw analog output from the UV sensor.
- GY-906 / MLX90614: object temperature in Celsius over I2C.

This is deliberately the sensor set used by the existing Arduino prototype. NeoSpectra,
AS7341, VEML6075, MLX90640, HX711 and BME688 are not assumed to be installed.

## Serial contract

Arduino must use the configured baud rate (default 9600) and print one newline-terminated
record for each measurement after receiving the command `START`:

```text
COLOR_DATA,<red>,<green>,<blue>
UV_DATA,<raw_adc_or_voltage>
IR_DATA,<object_temperature_c>
```

The order may vary. A scan succeeds only after all three record types are received.
Malformed and missing readings are not replaced with random or estimated numbers.
Do not label the UV value as volts unless the Arduino firmware actually converts its ADC
reading using the measured reference voltage.

## Configure the backend

Set these environment variables for the backend process:

- `HONEY_SERIAL_PORT`: Windows example `COM5`; Linux example `/dev/ttyACM0`.
- `HONEY_SERIAL_BAUD`: `9600` unless the firmware uses another rate.
- `HONEY_SCAN_TIMEOUT_SECONDS`: default `45`.
- `HONEY_UV_UNIT`: descriptive unit label; default `raw_or_voltage`.
- `HONEY_PYTHON_EXECUTABLE`: optional Python executable override.

Install Python dependencies from this directory with
`python -m pip install -r hardware/requirements.txt` (run from the repository root).

Close Arduino Serial Monitor and any other process holding the COM port before starting
a scan. On Windows, select the COM port assigned to the CH340/Arduino board.

## Important measurement limitation

RGB, UV sensor output and object temperature are raw/physical readings. These three
measurements alone do not directly measure fructose, glucose, sucrose, moisture, HMF,
density, or honey authenticity. The current runtime therefore records the acquired
measurements but marks purity/classification as **not evaluated**. A verified decision
requires a validated reference method, calibration set and blinded sample validation.
