# Hardware Model Specification: OpenMesh Radio

> **ID:** `Radio`  
> **Type:** `NETWORK`  
> **Models:** OM5P-AN, OM5P-AC

---

## Description

FRC field network bridge. Powered from a VRM 12V/2A output (not directly from a PDH high-current channel) and connected to the roboRIO over Ethernet.

---

## Available Ports

| Port ID | Type | Direction | Required? | Max Connections | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `power_in` | `POWER` | `INPUT` | Yes | 1 | 12V, 2A max from VRM (red wire) |
| `ground` | `GROUND` | `INPUT` | Yes | 1 | Ground return (black wire) |
| `eth_poe` | `ETHERNET` | `BIDIRECTIONAL` | Yes | 1 | Port nearest barrel jack / POE path to roboRIO |
| `eth_aux` | `ETHERNET` | `BIDIRECTIONAL` | No | 1 | Secondary Ethernet for coprocessors |

---

## Hardware Requirements

* Must connect to at least one `POWER` source and one `GROUND` return.
* Requires at least one `ETHERNET` connection on the robot network.
* Typical wiring: PDH `vrm_out` → VRM → radio `power_in` on a 12V/2A output.

---

## Metadata

```json
{
  "role": "field-network-bridge",
  "models": ["OM5P-AN", "OM5P-AC"],
  "nominalVoltage": 12,
  "maxCurrentAmps": 2,
  "defaultIpAddress": "10.6.91.1"
}
```
