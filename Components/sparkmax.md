# Hardware Model Specification: SparkMax Motor Controller

> **ID:** `SparkMax`  
> **Type:** `MOTOR`  
> **Layout Position:** `X: 0, Y: 0` (Used for visual canvas rendering)

---

## Available Ports

| Port ID | Type | Direction | Required? | Max Connections | VOLTAGE/AMPS |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `main_pwr` | `POWER` | `INPUT` | Yes | `1` | 12/100 |
| `motor_pwr` | `POWER` | `OUTPUT` | NO | `1` | 12/60 |
| `motor_oout` | `PWM` | `BIDIRECTIONAL` | Yes | `1` | 0/0 |
| `can_bus_0`| `CAN` | `BIDIRECTIONAL`| YES | `1` | 0/0 |
| `usb_c` | `CAN`| `BIDIRECTIONAL`| No | `1` | 0/0 |

---

## Hardware Requirements

* **Requirement 1:** Must connect to at least `1` `POWER` source.
* **Requirement 2:** Requires a minimum of `1` `CAN` connection for data routing.

---

## Metadata

```json
{
  "manufacturer": "REV_ROBOTICS",
  "operatingVoltage": "12V",
  "price": "$100",
  "firmwareVersion": "v2.1.0"
}
