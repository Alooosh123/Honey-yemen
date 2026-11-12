#include <Wire.h>
#include <Adafruit_TCS34725.h>
#include <Adafruit_MLX90614.h>
#include <math.h>

// Honey Yemen real-device firmware.
// Hardware:
//   TCS34725: I2C (SDA=A4, SCL=A5 on Arduino Uno)
//   GY-906 / MLX90614: I2C (same bus)
//   GY-ML8511: analog OUT -> A0
//
// Serial protocol (9600 baud):
//   Host sends: START
//   Device returns:
//     COLOR_DATA,<raw_R>,<raw_G>,<raw_B>
//     UV_DATA,<raw_ADC>
//     IR_DATA,<object_temperature_c>
//     SCAN_COMPLETE
//
// UV is deliberately reported as raw ADC counts. Convert to voltage/wavelength/HMF
// only after validating the actual module supply, analog reference and calibration.

namespace {
constexpr unsigned long SERIAL_BAUD = 9600;
constexpr uint8_t UV_ANALOG_PIN = A0;
constexpr uint8_t RGB_SAMPLE_COUNT = 5;
constexpr uint8_t UV_SAMPLE_COUNT = 20;
constexpr uint8_t IR_SAMPLE_COUNT = 5;

Adafruit_TCS34725 colorSensor(
  TCS34725_INTEGRATIONTIME_154MS,
  TCS34725_GAIN_4X
);
Adafruit_MLX90614 irSensor = Adafruit_MLX90614();

bool colorReady = false;
bool irReady = false;

void emitError(const __FlashStringHelper *message) {
  Serial.print(F("SENSOR_ERROR,"));
  Serial.println(message);
}

bool readColor(uint16_t &red, uint16_t &green, uint16_t &blue) {
  uint32_t rTotal = 0;
  uint32_t gTotal = 0;
  uint32_t bTotal = 0;

  for (uint8_t i = 0; i < RGB_SAMPLE_COUNT; ++i) {
    uint16_t r = 0, g = 0, b = 0, clear = 0;
    colorSensor.getRawData(&r, &g, &b, &clear);
    rTotal += r;
    gTotal += g;
    bTotal += b;
  }

  red = static_cast<uint16_t>(rTotal / RGB_SAMPLE_COUNT);
  green = static_cast<uint16_t>(gTotal / RGB_SAMPLE_COUNT);
  blue = static_cast<uint16_t>(bTotal / RGB_SAMPLE_COUNT);
  return true;
}

uint16_t readUvRaw() {
  uint32_t total = 0;
  for (uint8_t i = 0; i < UV_SAMPLE_COUNT; ++i) {
    total += analogRead(UV_ANALOG_PIN);
    delay(10);
  }
  return static_cast<uint16_t>(total / UV_SAMPLE_COUNT);
}

bool readObjectTemperature(float &temperatureC) {
  float total = 0.0f;
  for (uint8_t i = 0; i < IR_SAMPLE_COUNT; ++i) {
    const float reading = irSensor.readObjectTempC();
    if (!isfinite(reading) || reading < -70.0f || reading > 380.0f) {
      return false;
    }
    total += reading;
    delay(100);
  }
  temperatureC = total / IR_SAMPLE_COUNT;
  return isfinite(temperatureC);
}

void performScan() {
  if (!colorReady) {
    emitError(F("TCS34725_NOT_FOUND"));
    return;
  }
  if (!irReady) {
    emitError(F("MLX90614_NOT_FOUND"));
    return;
  }

  uint16_t red = 0, green = 0, blue = 0;
  if (!readColor(red, green, blue)) {
    emitError(F("TCS34725_READ_FAILED"));
    return;
  }

  const uint16_t uvRaw = readUvRaw();

  float objectTemperatureC = NAN;
  if (!readObjectTemperature(objectTemperatureC)) {
    emitError(F("MLX90614_INVALID_TEMPERATURE"));
    return;
  }

  Serial.print(F("COLOR_DATA,"));
  Serial.print(red);
  Serial.print(',');
  Serial.print(green);
  Serial.print(',');
  Serial.println(blue);

  Serial.print(F("UV_DATA,"));
  Serial.println(uvRaw);

  Serial.print(F("IR_DATA,"));
  Serial.println(objectTemperatureC, 2);

  Serial.println(F("SCAN_COMPLETE"));
}
}  // namespace

void setup() {
  Serial.begin(SERIAL_BAUD);
  Wire.begin();

  colorReady = colorSensor.begin();
  irReady = irSensor.begin();

  Serial.println(F("HONEY_YEMEN_DEVICE_READY"));
  if (!colorReady) Serial.println(F("SENSOR_WARNING,TCS34725_NOT_FOUND"));
  if (!irReady) Serial.println(F("SENSOR_WARNING,MLX90614_NOT_FOUND"));
}

void loop() {
  if (!Serial.available()) return;

  String command = Serial.readStringUntil('\n');
  command.trim();
  command.toUpperCase();

  if (command == "START") {
    performScan();
  }
}
