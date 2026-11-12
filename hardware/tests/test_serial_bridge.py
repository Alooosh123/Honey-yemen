import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import serial_bridge


class SerialBridgeParserTests(unittest.TestCase):
    def test_color_data(self):
        self.assertEqual(
            serial_bridge.parse_line("COLOR_DATA,123,456,789"),
            ("color", {"r": 123, "g": 456, "b": 789}),
        )

    def test_uv_data_preserves_raw_unit(self):
        kind, value = serial_bridge.parse_line("UV_DATA,227")
        self.assertEqual(kind, "uv")
        self.assertEqual(value["raw"], 227.0)
        self.assertEqual(value["unit"], "raw_or_voltage")

    def test_ir_temperature(self):
        self.assertEqual(
            serial_bridge.parse_line("IR_DATA,29.63"),
            ("ir", {"temperatureC": 29.63}),
        )

    def test_unrelated_boot_text_is_ignored(self):
        self.assertIsNone(serial_bridge.parse_line("Arduino starting..."))

    def test_invalid_color_count_is_rejected(self):
        with self.assertRaises(ValueError):
            serial_bridge.parse_line("COLOR_DATA,10,20")

    def test_out_of_range_color_is_rejected(self):
        with self.assertRaises(ValueError):
            serial_bridge.parse_line("COLOR_DATA,10,20,999999")

    def test_sensor_error_is_not_ignored(self):
        with self.assertRaises(RuntimeError):
            serial_bridge.parse_line("SENSOR_ERROR,TCS34725_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
