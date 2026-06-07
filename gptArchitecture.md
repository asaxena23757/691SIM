# FRC Architecture Verification Platform - Technical Design

## Vision

Create a desktop application that allows FRC teams to:

* Design robot electrical architectures visually
* Verify wiring correctness
* Detect common electrical/networking issues
* Estimate current draw and brownout risk
* Validate CAN topology
* Generate inspection and design reports
* Serve as a "lint checker" for robot architectures

The system is not intended to be a traditional circuit simulator (SPICE).

Instead, it is a robot architecture compiler and verification engine.

---

# Phase 1: Core Architecture

## Design Philosophy

The system should be structured similarly to a compiler.

```text
Visual Editor
      ↓
Robot Specification
      ↓
Graph Builder
      ↓
Verification Passes
      ↓
Estimation Passes
      ↓
Diagnostics + Reports
```

The visual editor is only one frontend.

The graph representation is the source of truth.

---

# Repository Structure

```text
frc-arch/

├── apps/
│   ├── desktop/
│   └── web/
│
├── packages/
│   ├── core/
│   ├── registry/
│   ├── verifier/
│   ├── estimator/
│   ├── serialization/
│   ├── report-generator/
│   └── plugins/
│
└── docs/
```

---

# Technology Stack

## Frontend

* React
* TypeScript
* React Flow

Reason:

React Flow already solves:

* node editing
* edge creation
* graph visualization
* custom node rendering

---

## Desktop

### Initial

Tauri

Benefits:

* Cross-platform
* Small binary size
* Native packaging
* Rust backend available later

---

## Backend/Core

TypeScript initially.

Reason:

* Shared types between frontend and backend
* Faster iteration
* Lower complexity

Future:

Performance-critical estimation engines can migrate to Rust.

---

# Phase 2: Robot Specification

The robot is represented as a graph.

---

## Device

```ts
interface Device {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}
```

Example:

```json
{
  "id": "spark_left",
  "type": "SparkMax"
}
```

---

## Connection

```ts
interface Connection {
  source: string;
  target: string;
  kind: ConnectionKind;
}
```

Connection kinds:

```ts
POWER
CAN
ETHERNET
USB
PWM
DIO
SPI
I2C
```

---

## Robot

```ts
interface Robot {
  devices: Device[];
  connections: Connection[];
}
```

This becomes the canonical representation.

Everything operates on this model.

---

# Phase 3: Device Registry

The registry defines hardware behavior.

This is the most valuable dataset in the system.

---

## Device Definition

```ts
interface DeviceDefinition {
  type: string;

  interfaces: InterfaceDefinition[];

  requirements: Requirement[];

  metadata: DeviceMetadata;
}
```

---

## Example

```json
{
  "type": "SparkMax",

  "interfaces": [
    "power",
    "can"
  ],

  "requirements": {
    "power": true,
    "can": true
  },

  "electrical": {
    "maxCurrent": 60
  }
}
```

---

## Registry Purpose

The verifier never hardcodes SparkMax logic.

Instead:

```text
Verifier
     ↓
Registry
     ↓
Device Behavior
```

This enables plugin support.

---

# Phase 4: Graph Construction

Convert Robot Specification into a graph.

---

## Internal Graph

```text
Nodes:
  Devices

Edges:
  Connections
```

Example:

```text
Battery
  |
PDH
  |
SparkMax
  |
Kraken
```

---

## Graph Responsibilities

Provide APIs:

```ts
getNeighbors()

getDevicesByType()

findDisconnectedNodes()

findPowerPaths()

findCanTopology()
```

This becomes the foundation for all analysis.

---

# Phase 5: Verification Engine

Verification acts like compiler passes.

Each pass analyzes the graph.

---

## Rule Interface

```ts
interface Rule {
  verify(
      graph: RobotGraph
  ): Diagnostic[];
}
```

---

## Diagnostic

```ts
interface Diagnostic {
  severity:
      "error" |
      "warning" |
      "info";

  message: string;

  devices: string[];
}
```

---

# Verification Passes

## Pass 1

Missing Power

Checks:

* motor controllers
* sensors
* coprocessors

Detects:

```text
SparkMax connected to CAN
but not connected to power.
```

---

## Pass 2

Missing Communication

Checks:

* CAN
* Ethernet
* USB

Detects:

```text
Limelight has no network path.
```

---

## Pass 3

Duplicate CAN IDs

Detect:

```text
SparkMax #3
SparkMax #4

Both use CAN ID 7
```

---

## Pass 4

Disconnected CAN Segments

Graph traversal.

Detect:

```text
Device unreachable from controller.
```

---

## Pass 5

Breaker Validation

Example:

```text
Kraken

Connected to:
20A breaker
```

Produces warning.

---

## Pass 6

Power Distribution Validation

Checks:

* overloaded channels
* invalid wiring paths
* unsupported configurations

---

## Pass 7

Network Validation

Checks:

* reachability
* bandwidth
* conflicts

For:

* Limelight
* PhotonVision
* Orange Pi
* Switches
* Radio

---

# Phase 6: Estimation Engine

Verification determines validity.

Estimation predicts behavior.

---

## Current Draw Estimator

Uses:

* motor definitions
* subsystem metadata

Outputs:

```text
Average Current

Peak Current

Expected Battery Load
```

---

## Brownout Estimator

Uses:

```text
Battery Resistance

Current Draw

Voltage Sag Models
```

Outputs:

```text
Predicted Minimum Voltage
```

---

## Weight Estimator

Registry contains:

```text
device weights
```

Produces:

```text
Estimated Robot Weight
```

---

## CAN Utilization Estimator

Approximates:

```text
bus load
message volume
```

Produces:

```text
CAN Utilization %
```

---

# Phase 7: Report Generation

Generate machine-readable and human-readable outputs.

---

## Design Report

Contains:

```text
Device Summary

Power Summary

CAN Summary

Network Summary
```

---

## Inspection Report

Contains:

```text
Potential Inspection Issues

Warnings

Electrical Health Score
```

---

## Export Formats

```text
PDF

JSON

Markdown
```

---

# Phase 8: Plugin System

Long-term scalability requires plugins.

---

## Plugin Interface

```ts
interface Plugin {

  devices: DeviceDefinition[];

  rules: Rule[];

  estimators: Estimator[];
}
```

---

## Example Plugins

```text
REV

CTRE

PhotonVision

Limelight

WPILib

SystemCore
```

Each plugin contributes:

* devices
* validation rules
* estimators

without modifying core.

---

# Phase 9: Desktop Application

UI is a frontend over the graph engine.

---

## Editor

React Flow

Supports:

* drag devices
* create connections
* edit properties

---

## Panels

### Graph Editor

Visual architecture.

### Diagnostics Panel

Compiler-like output.

Example:

```text
ERROR:
Duplicate CAN ID 5

WARNING:
Expected peak current exceeds 300A
```

### Reports Panel

Generated summaries.

---

# MVP Roadmap

## Milestone 1

Core Graph Engine

* Robot model
* Device registry
* Serialization

---

## Milestone 2

Verification Engine

* Missing power
* Missing CAN
* Duplicate CAN IDs
* Connectivity checks

---

## Milestone 3

React Flow Editor

* Device placement
* Connections
* Property editing

---

## Milestone 4

Current/Brownout Estimation

* Current budget
* Voltage sag estimation

---

## Milestone 5

Reports

* Inspection report
* Design report

---

## Milestone 6

Plugin SDK

* Third-party devices
* Third-party rules

At this point the system becomes genuinely useful to FRC teams and can be expanded toward advanced simulation, subsystem modeling, and future SystemCore support.
