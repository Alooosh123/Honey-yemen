#!/usr/bin/env python3
"""Serial bridge for Arduino Uno + TCS34725 + GY-ML8511 + MLX90614.

Accepted newline-delimited frames at 9600 baud:
  COLOR_DATA,<red>,<green>,<blue>
  UV_DATA,<adc_raw>
  IR_DATA,<object_temperature_c>

The bridge sends START\\n and averages all valid frames during one scan window.
It never generates fallback/synthetic sensor values.
"""
from __future__ import annotations

import json
import os
import statistics
import sys
import time
from typing import Any

try:
    import serial
except ImportError as exc:
    print(json.dumps({"type": "error", "message": "pySerial is missing. Install backend/hardware/requirements.txt."}), flush=True)
    sys.exit(2)


def emit(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def number(value: str) -> float:
    parsed = float(value.strip())
    if not (parsed == parsed and abs(parsed) != float("inf")):
        raise ValueError("non-finite numeric value")
    return parsed


def average(values: list[float]) -> float:
    return float(statistics.fmean(values))


def main() -> int:
    if len(sys.argv) < 4:
        emit({"type": "error", "message": "Usage: serial_bridge.py PORT BAUD BATCH_NUMBER"})
        return 2

    port = sys.argv[1]
    baud = int(sys.argv[2])
    batch_number = sys.argv[3]
    scan_seconds = float(os.getenv("HARDWARE_SCAN_SECONDS", "23"))
    adc_reference = os.getenv("ADC_REFERENCE_VOLTAGE", "").strip()
    adc_voltage = float(adc_reference) if adc_reference else None
    adc_max = int(os.getenv("ADC_MAX_VALUE", "1023"))

    color_r: list[float] = []
    color_g: list[float] = []
    color_b: list[float] = []
    uv_raw: list[float] = []
    ir_object: list[float] = []

    start = time.monotonic()
    emit({"type": "progress", "stage": "تهيئة المنفذ التسلسلي وإعادة مزامنة Arduino", "percent": 8})

    try:
        with serial.Serial(port, baudrate=baud, timeout=0.5, write_timeout=2) as device:
            # Arduino Uno commonly resets when the serial port opens.
            time.sleep(2.0)
            device.reset_input_buffer()
            device.write(b"START\n")
            device.flush()
            emit({"type": "progress", "stage": "بدء دورة القياس وجمع RGB وUV ودرجة حرارة العينة", "percent": 15})

            deadline = time.monotonic() + scan_seconds
            last_progress = 15
            while time.monotonic() < deadline:
                raw_line = device.readline()
                if not raw_line:
                    continue
                try:
                    line = raw_line.decode("utf-8", errors="strict").strip()
                    fields = [part.strip() for part in line.split(",")]
                    if len(fields) == 4 and fields[0] == "COLOR_DATA":
                        r, g, b = (number(v) for v in fields[1:4])
                        if all(0 <= v <= 65535 for v in (r, g, b)):
                            color_r.append(r)
                            color_g.append(g)
                            color_b.append(b)
                            emit({"type": "sensor", "sensor": "color", "data": {"r": r, "g": g, "b": b}})
                    elif len(fields) == 2 and fields[0] == "UV_DATA":
                        value = number(fields[1])
                        if 0 <= value <= adc_max:
                            uv_raw.append(value)
                            voltage = (value / adc_max) * adc_voltage if adc_voltage else None
                            emit({"type": "sensor", "sensor": "uv", "data": {"adcRaw": value, "voltage": voltage}})
                    elif len(fields) >= 2 and fields[0] == "IR_DATA":
                        object_temp = number(fields[1])
                        if -40 <= object_temp <= 500:
                            ir_object.append(object_temp)
                            ambient = number(fields[2]) if len(fields) >= 3 else None
                            emit({"type": "sensor", "sensor": "ir", "data": {"objectTemperatureC": object_temp, "ambientTemperatureC": ambient}})
                except (UnicodeDecodeError, ValueError, IndexError):
                    # A malformed frame must not be converted into a measurement.
                    continue

                elapsed = time.monotonic() - start
                progress = min(90, 15 + int((elapsed / max(scan_seconds, 1)) * 75))
                if progress >= last_progress + 5:
                    last_progress = progress
                    emit({"type": "progress", "stage": "استقبال القراءات الفعلية من الحساسات", "percent": progress})

    except (serial.SerialException, OSError, ValueError) as exc:
        emit({"type": "error", "message": f"Serial connection failed on {port}: {exc}"})
        return 3

    missing = []
    if not color_r:
        missing.append("TCS34725 COLOR_DATA")
    if not uv_raw:
        missing.append("GY-ML8511 UV_DATA")
    if not ir_object:
        missing.append("MLX90614 IR_DATA")
    if missing:
        emit({"type": "error", "message": "No valid reading received from: " + ", ".join(missing) + ". Check wiring, firmware protocol and sensor power."})
        return 4

    measurements = {
        "color": {
            "r": round(average(color_r), 2),
            "g": round(average(color_g), 2),
            "b": round(average(color_b), 2),
            "samples": len(color_r),
        },
        "uv": {
            "adcRaw": round(average(uv_raw), 2),
            "voltage": round((average(uv_raw) / adc_max) * adc_voltage, 4) if adc_voltage else None,
            "samples": len(uv_raw),
        },
        "infrared": {
            "objectTemperatureC": round(average(ir_object), 2),
            "samples": len(ir_object),
        },
    }
    emit({
        "type": "progress",
        "stage": "اكتملت القراءات؛ حفظ القياسات الخام دون إصدار حكم على أصالة العسل",
        "percent": 100,
    })
    emit({
        "type": "complete",
        "batchNumber": batch_number,
        "durationSeconds": round(time.monotonic() - start, 2),
        "measurements": measurements,
    })
    return 0


if __name__ == "__main__":
    sys.exit(main())
