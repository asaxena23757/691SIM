# Hardware Model Specification: Power Distribution Hub

> **ID:** `PDH`  
> **Type:** `POWER`  
> **Manufacturer:** REV Robotics (REV-11-1850)

---

## Description

Distributes 12V robot power across 24 fused channels and exposes CAN/USB-C telemetry per the [REV PDH documentation](https://docs.revrobotics.com/ion-control/pdh/overview).

---

## Available Ports

| Port ID | Type | Direction | Required? | Max Connections | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `main_power_in` | `POWER` | `INPUT` | Yes | 1 | 12V main input (red wire) |
| `ground_in` | `GROUND` | `INPUT` | Yes | 1 | Main ground return (black wire) |
| `channel_0` … `channel_19` | `POWER` | `OUTPUT` | No | 1 each | High-current channels, 40A max |
| `channel_20` … `channel_22` | `POWER` | `OUTPUT` | No | 1 each | Low-current channels, 15A max |
| `channel_23` | `POWER` | `OUTPUT` | No | 1 | Switched low-current channel |
| `vrm_out` | `POWER` | `OUTPUT` | No | 1 | Dedicated VRM feed |
| `ground_bus` | `GROUND` | `OUTPUT` | No | 32 | Common ground distribution |
| `can_bus` | `CAN` | `BIDIRECTIONAL` | No | 2 | Yellow/green twisted CAN pair |
| `usb_c` | `USBC` | `BIDIRECTIONAL` | No | 1 | USB-to-CAN configuration port |

---

## Hardware Requirements

* Must connect to at least one `POWER` source and one `GROUND` return.
* Each powered channel requires an appropriately sized breaker or fuse.
* Default CAN ID for FRC Driver Station logging is `1`.

---

## Metadata

```json
{
  "manufacturer": "REV Robotics",
  "partNumber": "REV-11-1850",
  "operatingVoltage": "12V",
  "highCurrentChannels": "0-19",
  "lowCurrentChannels": "20-22",
  "switchedChannel": "23",
  "defaultCanId": 1
}
```
