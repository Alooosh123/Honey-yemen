#!/usr/bin/env python3
"""Read one real Honey Yemen scan from the Arduino serial protocol.

Expected CSV lines (one per line):
  COLOR_DATA,<red>,<green>,<blue>
  UV_DATA,<raw_adc_or_voltage>
  IR_DATA,<object_temperature_c>

The bridge never invents readings. Missing or malformed measurements fail the scan.
"""
from __future__ import annotations

import json
import os
import sys
import time
from typing import Any

try:
    import serial
except ImportError as exc:  # pragma: no cover - exercised on deployment
    print(f"pyserial is required: {exc}", file=sys.stderr, flush=True)
    raise SystemExit(10)


def emit(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def parse_number(value: str, label: str) -> float:
    try:
        number = float(value.strip())
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid {label} value: {value!r}") from exc
    if not (number == number and abs(number) != float("inf")):
        raise ValueError(f"Non-finite {label} value")
    return number


def parse_line(line: str) -> tuple[str, Any] | None:
    parts = [part.strip() for part in line.split(",")]
    if not parts or not parts[0]:
        return None

    kind = parts[0].upper()
    if kind == "COLOR_DATA":
        if len(parts) != 4:
            raise ValueError("COLOR_DATA must contain exactly R,G,B")
        rgb = [int(parse_number(value, "RGB")) for value in parts[1:]]
        if any(value < 0 or value > 65535 for value in rgb):
            raise ValueError("RGB readings must be between 0 and 65535")
        return "color", {"r": rgb[0], "g": rgb[1], "b": rgb[2]}

    if kind == "UV_DATA":
        if len(parts) != 2:
            raise ValueError("UV_DATA must contain exactly one raw reading")
        value = parse_number(parts[1], "UV")
        if value < 0 or value > 65535:
            raise ValueError("UV raw reading must be between 0 and 65535")
        return "uv", {"raw": value, "unit": os.getenv("HONEY_UV_UNIT", "raw_or_voltage")}

    if kind == "IR_DATA":
        if len(parts) != 2:
            raise ValueError("IR_DATA must contain exactly one temperature")
        value = parse_number(parts[1], "IR temperature")
        if value < -70 or value > 380:
            raise ValueError("IR temperature is outside the MLX90614 supported physical range")
        return "ir", {"temperatureC": value}

    if kind == "SENSOR_ERROR":
        raise RuntimeError(",".join(parts[1:]) or "Arduino reported a sensor error")

    if kind in {"READY", "SCAN_COMPLETE"}:
        return kind.lower(), None

    # Ignore boot banners and unrelated debug lines; they are not measurements.
    return None


def main() -> int:
    port = os.getenv("HONEY_SERIAL_PORT", "").strip()
    baud = int(os.getenv("HONEY_SERIAL_BAUD", "9600"))
    timeout_seconds = float(os.getenv("HONEY_SCAN_TIMEOUT_SECONDS", "45"))
    reset_delay = float(os.getenv("HONEY_SERIAL_RESET_DELAY_SECONDS", "2"))

    if not port:
        emit({"event": "error", "message": "HONEY_SERIAL_PORT is not configured. Set it to the Arduino COM port."})
        return 2
    if baud <= 0 or timeout_seconds <= 0:
        emit({"event": "error", "message": "Serial baud rate and scan timeout must be positive."})
        return 2

    readings: dict[str, Any] = {}
    started_at = time.time()

    try:
        with serial.Serial(port=port, baudrate=baud, timeout=1) as device:
            # Arduino Uno commonly resets when the serial port is opened.
            time.sleep(max(0, reset_delay))
            device.reset_input_buffer()
            device.write(b"START\n")
            device.flush()
            emit({"event": "progress", "stage": "تم إرسال أمر START إلى Arduino", "percent": 10})

            while time.time() - started_at < timeout_seconds:
                raw = device.readline()
                if not raw:
                    continue

                line = raw.decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                try:
                    parsed = parse_line(line)
                except Exception as exc:
                    emit({"event": "warning", "message": str(exc), "line": line[:160]})
                    continue

                if parsed is None:
                    continue

                kind, value = parsed
                if kind in {"ready", "scan_complete"}:
                    continue

                readings[kind] = value
                percent = {"color": 40, "uv": 65, "ir": 85}[kind]
                emit({"event": "data", "type": kind, "data": value, "percent": percent})

                if all(key in readings for key in ("color", "uv", "ir")):
                    emit({
                        "event": "complete",
                        "device": {"port": port, "baudRate": baud},
                        "acquiredAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "readings": readings,
                    })
                    return 0

        missing = [key for key in ("color", "uv", "ir") if key not in readings]
        emit({
            "event": "error",
            "message": f"Scan timed out after {timeout_seconds:g}s; missing readings: {', '.join(missing)}",
        })
        return 3
    except Exception as exc:
        emit({"event": "error", "message": f"Serial acquisition failed: {exc}"})
        return 4


if __name__ == "__main__":
    raise SystemExit(main())
