# Hardware Model Specification: Spark MAX Motor Controller

> **ID:** `SparkMax`  
> **Type:** `MOTOR_CONTROLLER`  
> **Manufacturer:** REV Robotics (REV-11-2158)

---

## Description

Brushless motor controller with integrated encoder support, CAN control, and USB-C configuration.

---

## Available Ports

| Port ID | Type | Direction | Required? | Max Connections | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `power_in` | `POWER` | `INPUT` | Yes | 1 | 12V input (red wire) |
| `ground` | `GROUND` | `INPUT` | Yes | 1 | Ground return (black wire) |
| `motor_a` | `POWER` | `OUTPUT` | No | 1 | Brushless phase A |
| `motor_b` | `POWER` | `OUTPUT` | No | 1 | Brushless phase B |
| `motor_c` | `POWER` | `OUTPUT` | No | 1 | Brushless phase C |
| `can_bus` | `CAN` | `BIDIRECTIONAL` | No | 2 | Yellow/green twisted CAN pair |
| `usb_c` | `USBC` | `BIDIRECTIONAL` | No | 1 | REV Hardware Client configuration |

---

## Hardware Requirements

* Must connect to at least one `POWER` source and one `GROUND` return.
* Requires a `CAN` connection for robot control.

---

## Metadata

```json
{
  "manufacturer": "REV Robotics",
  "partNumber": "REV-11-2158",
  "operatingVoltage": "12V",
  "motorType": "brushless-3-phase"
}
```
