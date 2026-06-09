# Hardware Model Specification: Power Distribution Hub

> **ID:** `PDH`  
> **Type:** `POWER_DISTRIBUTION`  
> **Layout Position:** `X: 0, Y: 0` (Used for visual canvas rendering)

---

## Description
Distributs Power

---

## Available Ports

| Port ID | Type | Direction | Required? | Max Connections | VOLTAGE/AMPS |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `main_pwr` | `POWER` | `INPUT` | Yes | `1` | 12/120 |
| `can_bus_0`| `CAN` | `BIDIRECTIONAL`| YES | `1` | 0/0 |
| `can_bus_2`| `CAN` | `BIDIRECTIONAL`| No | `1` | 0/0 |
| `power_out` | `POWER`| `OUTPUT`| No | `20` | FUSE |
| `usb_c` | `CAN`| `BIDIRECTIONAL`| No | `1` | 0/0 |
---

## Hardware Requirements

* **Requirement 1:** Must connect to at least `1` `POWER` source.
* **Requirement 2:** Requires a minimum of `1` `CAN` connection for data routing.
* **Requirement 3:** Requires '1' breaker per 'power_out' to output power'

---

## Metadata

```json
{
  "manufacturer": "REV_ROBOTICS",
  "operatingVoltage": "12V",
  "price": "$250",
  "firmwareVersion": "v2.1.0"
}
