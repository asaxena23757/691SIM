# FRC Architecture Verifier - Technical Task List

## Phase 0: Project Setup

### Monorepo Setup

* [ ] Create monorepo structure using pnpm workspaces
* [ ] Configure TypeScript project references
* [ ] Configure ESLint and Prettier
* [ ] Configure GitHub Actions CI pipeline
* [ ] Configure unit testing framework (Vitest)
* [ ] Configure package build system (tsup)

### Repository Structure

* [ ] Create `apps/desktop`
* [ ] Create `packages/core`
* [ ] Create `packages/registry`
* [ ] Create `packages/verifier`
* [ ] Create `packages/estimator`
* [ ] Create `packages/serialization`

---

## Phase 1: Core Data Model

### Shared Types

* [ ] Implement `PortType` enum
* [ ] Implement `PortDirection` enum
* [ ] Implement `DeviceCategory` enum
* [ ] Implement `Severity` enum

### Core Interfaces

* [ ] Implement `Port`
* [ ] Implement `Connection`
* [ ] Implement `Requirement`
* [ ] Implement `DeviceDefinition`
* [ ] Implement `DeviceInstance`
* [ ] Implement `Diagnostic`
* [ ] Implement `RobotModel`

### Serialization

* [ ] Define project JSON schema
* [ ] Implement JSON import
* [ ] Implement JSON export
* [ ] Add schema validation

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

* [ ] Add current metadata to registry
* [ ] Calculate peak current draw
* [ ] Calculate nominal current draw

### Brownout Estimation

* [ ] Model battery internal resistance
* [ ] Estimate voltage sag
* [ ] Estimate brownout risk

### CAN Estimation

* [ ] Estimate CAN utilization
* [ ] Estimate device count impact

### Weight Estimation

* [ ] Add weight metadata to registry
* [ ] Calculate total estimated weight

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
