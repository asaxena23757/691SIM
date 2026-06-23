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

* [ ] Implement `DeviceRegistry`
* [ ] Implement device lookup API
* [ ] Implement device registration API
* [ ] Implement plugin loading mechanism

### Initial Device Definitions

#### Power

* [ ] Battery
* [ ] PDP
* [ ] PDH
* [ ] VRM

#### Controllers

* [ ] RoboRIO
* [ ] SystemCore

#### Motor Controllers

* [ ] Spark MAX
* [ ] Spark Flex
* [ ] Talon FX

#### Sensors

* [ ] CANcoder
* [ ] Pigeon 2

#### Vision

* [ ] Limelight
* [ ] PhotonVision
* [ ] Orange Pi

#### Network

* [ ] Radio
* [ ] Ethernet Switch

---

## Phase 3: Graph Engine

### Graph Construction

* [ ] Build graph from `RobotModel`
* [ ] Create device node abstraction
* [ ] Create port node abstraction
* [ ] Create edge abstraction

### Graph Utilities

* [ ] Implement device lookup
* [ ] Implement port lookup
* [ ] Implement graph traversal
* [ ] Implement shortest path search
* [ ] Implement connected component search

### Reachability APIs

* [ ] Implement power reachability
* [ ] Implement CAN reachability
* [ ] Implement network reachability

---

## Phase 4: Verification Engine

### Verification Framework

* [ ] Implement verification pass interface
* [ ] Implement diagnostic collection
* [ ] Implement verification runner

### Type Validation

* [ ] Validate compatible port types
* [ ] Validate port directions
* [ ] Validate maximum connections

### Required Connections

* [ ] Validate required power ports
* [ ] Validate required CAN ports
* [ ] Validate required Ethernet ports

### Power Verification

* [ ] Verify battery exists
* [ ] Verify controller power path
* [ ] Verify motor controller power paths
* [ ] Verify coprocessor power paths

### CAN Verification

* [ ] Verify CAN connectivity
* [ ] Detect duplicate CAN IDs
* [ ] Detect isolated CAN segments

### Network Verification

* [ ] Verify radio exists
* [ ] Verify network reachability
* [ ] Detect IP conflicts

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
