# FRC Architecture Verifier - Technical Task List

## Phase 0: Project Setup

### Monorepo Setup

* [x] Create monorepo structure using pnpm workspaces
* [x] Configure TypeScript project references
* [x] Configure ESLint and Prettier
* [x] Configure GitHub Actions CI pipeline
* [x] Configure unit testing framework (Vitest)
* [x] Configure package build system (tsup)

### Repository Structure

* [x] Create `apps/desktop`
* [x] Create `packages/core`
* [x] Create `packages/registry`
* [x] Create `packages/verifier`
* [x] Create `packages/estimator`
* [x] Create `packages/serialization`

---

## Phase 1: Core Data Model

### Shared Types

* [x] Implement `PortType` enum
* [x] Implement `PortDirection` enum
* [x] Implement `DeviceCategory` enum
* [x] Implement `Severity` enum

### Core Interfaces

* [x] Implement `Port`
* [x] Implement `Connection`
* [x] Implement `Requirement`
* [x] Implement `DeviceDefinition`
* [x] Implement `DeviceInstance`
* [x] Implement `Diagnostic`
* [x] Implement `RobotModel`

### Serialization

* [x] Define project JSON schema
* [x] Implement JSON import
* [x] Implement JSON export
* [x] Add schema validation

---

## Phase 2: Device Registry

### Registry Infrastructure

* [x] Implement `DeviceRegistry`
* [x] Implement device lookup API
* [x] Implement device registration API
* [x] Implement plugin loading mechanism

### Initial Device Definitions

#### Power

* [x] Battery
* [x] PDP
* [x] PDH
* [x] VRM

#### Controllers

* [x] RoboRIO
* [x] SystemCore

#### Motor Controllers

* [x] Spark MAX
* [x] Spark Flex
* [x] Talon FX

#### Sensors

* [x] CANcoder
* [x] Pigeon 2

#### Vision

* [x] Limelight
* [x] PhotonVision
* [x] Orange Pi

#### Network

* [x] Radio
* [x] Ethernet Switch

---

## Phase 3: Graph Engine

### Graph Construction

* [x] Build graph from `RobotModel`
* [x] Create device node abstraction
* [x] Create port node abstraction
* [x] Create edge abstraction

### Graph Utilities

* [x] Implement device lookup
* [x] Implement port lookup
* [x] Implement graph traversal
* [x] Implement shortest path search
* [x] Implement connected component search

### Reachability APIs

* [x] Implement power reachability
* [x] Implement CAN reachability
* [x] Implement network reachability

---

## Phase 4: Verification Engine

### Verification Framework

* [x] Implement verification pass interface
* [x] Implement diagnostic collection
* [x] Implement verification runner

### Type Validation

* [x] Validate compatible port types
* [x] Validate port directions
* [x] Validate maximum connections

### Required Connections

* [x] Validate required power ports
* [x] Validate required CAN ports
* [x] Validate required Ethernet ports

### Power Verification

* [x] Verify battery exists
* [x] Verify controller power path
* [x] Verify motor controller power paths
* [x] Verify coprocessor power paths

### CAN Verification

* [x] Verify CAN connectivity
* [x] Detect duplicate CAN IDs
* [x] Detect isolated CAN segments

### Network Verification

* [x] Verify radio exists
* [x] Verify network reachability
* [x] Detect IP conflicts

---

## Phase 5: Estimation Engine

### Current Estimation

* [x] Add current metadata to registry
* [x] Calculate peak current draw
* [x] Calculate nominal current draw

### Brownout Estimation

* [x] Model battery internal resistance
* [x] Estimate voltage sag
* [x] Estimate brownout risk

### CAN Estimation

* [x] Estimate CAN utilization
* [x] Estimate device count impact

### Weight Estimation

* [x] Add weight metadata to registry
* [x] Calculate total estimated weight

---

## Phase 6: Desktop Application

### Desktop Infrastructure

* [ ] Create Tauri application
* [ ] Configure application packaging
* [ ] Configure auto-updates

### Editor

* [ ] Integrate React Flow
* [ ] Implement drag-and-drop device placement
* [ ] Implement port connections
* [ ] Implement device property editing

### Project Management

* [ ] Create new project workflow
* [ ] Implement save project
* [ ] Implement load project

### Diagnostics

* [ ] Create diagnostics panel
* [ ] Display errors and warnings
* [ ] Highlight affected devices

### Reports

* [ ] Generate verification summary
* [ ] Generate electrical health score
* [ ] Export report as Markdown

---

## Phase 7: MVP Testing

### Sample Architectures

* [ ] Create simple drivetrain example
* [ ] Create shooter example
* [ ] Create vision example

### Validation

* [ ] Compare outputs against real robots
* [ ] Validate current estimates
* [ ] Validate brownout estimates
* [ ] Validate CAN diagnostics

### User Testing

* [ ] Test with project 691
* [ ] Release to other teams via discord + chief delphi
* [ ] Collect feedback and reiterate

---

## Phase 8: Future Enhancements

* [ ] Plugin SDK
* [ ] Custom device definitions
* [ ] Inspection checklist generation
* [ ] Wiring diagram export
* [ ] WPILib integration
* [ ] Vendor library integration
* [ ] Telemetry import from real robots
* [ ] Automatic architecture generation
* [ ] Team project sharing
* [ ] Cloud synchronization
