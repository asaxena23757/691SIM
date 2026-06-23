import {
  PROJECT_SCHEMA_VERSION,
  Severity,
  type RobotModel,
} from "@691sim/core";
import { describe, expect, it } from "vitest";
import {
  buildGraph,
  DiagnosticCollection,
  verifyRobotModel,
  type VerificationPass,
} from "./index.js";

function healthyModel(): RobotModel {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: "robot-1",
    name: "Healthy Robot",
    devices: [
      { id: "battery-1", type: "Battery" },
      { id: "pdh-1", type: "PDH", metadata: { canId: 1 } },
      { id: "rio-1", type: "RoboRIO", metadata: { ipAddress: "10.6.91.2" } },
      { id: "radio-1", type: "Radio", metadata: { ipAddress: "10.6.91.1" } },
      { id: "spark-1", type: "SparkMax", metadata: { canId: 2 } },
      { id: "coder-1", type: "CANcoder", metadata: { canId: 3 } },
      {
        id: "limelight-1",
        type: "Limelight",
        metadata: { ipAddress: "10.6.91.11" },
      },
    ],
    connections: [
      {
        id: "battery-pdh",
        sourceDevice: "battery-1",
        sourcePort: "main_power",
        targetDevice: "pdh-1",
        targetPort: "main_power_in",
      },
      {
        id: "pdh-rio-power",
        sourceDevice: "pdh-1",
        sourcePort: "channel_0",
        targetDevice: "rio-1",
        targetPort: "power_in",
      },
      {
        id: "pdh-spark-power",
        sourceDevice: "pdh-1",
        sourcePort: "channel_1",
        targetDevice: "spark-1",
        targetPort: "power_in",
      },
      {
        id: "pdh-limelight-power",
        sourceDevice: "pdh-1",
        sourcePort: "channel_2",
        targetDevice: "limelight-1",
        targetPort: "power_in",
      },
      {
        id: "rio-pdh-can",
        sourceDevice: "rio-1",
        sourcePort: "can_bus",
        targetDevice: "pdh-1",
        targetPort: "can_bus",
      },
      {
        id: "pdh-spark-can",
        sourceDevice: "pdh-1",
        sourcePort: "can_bus",
        targetDevice: "spark-1",
        targetPort: "can_bus",
      },
      {
        id: "spark-coder-can",
        sourceDevice: "spark-1",
        sourcePort: "can_bus",
        targetDevice: "coder-1",
        targetPort: "can_bus",
      },
      {
        id: "radio-rio-eth",
        sourceDevice: "radio-1",
        sourcePort: "rio_eth",
        targetDevice: "rio-1",
        targetPort: "eth_0",
      },
      {
        id: "radio-limelight-eth",
        sourceDevice: "radio-1",
        sourcePort: "aux_eth",
        targetDevice: "limelight-1",
        targetPort: "eth_0",
      },
    ],
  };
}

describe("buildGraph", () => {
  it("constructs device nodes, port nodes, and connection edges", () => {
    const graph = buildGraph(healthyModel());

    expect(graph.getDevice("rio-1")?.definition.type).toBe("RoboRIO");
    expect(graph.getPort("spark-1", "can_bus")?.deviceId).toBe("spark-1");
    expect(graph.edges).toHaveLength(9);
  });

  it("traverses and finds shortest paths by connection type", () => {
    const graph = buildGraph(healthyModel());

    expect(graph.powerReachable("spark-1")).toBe(true);
    expect(graph.canReachable("coder-1")).toBe(true);
    expect(graph.networkReachable("limelight-1")).toBe(true);

    expect(
      graph.shortestPath("battery-1", "spark-1")?.map((device) => device.id),
    ).toEqual(["battery-1", "pdh-1", "spark-1"]);
  });

  it("returns connected components for a selected port type", () => {
    const graph = buildGraph({
      ...healthyModel(),
      devices: [...healthyModel().devices, { id: "coder-2", type: "CANcoder" }],
    });

    const canComponents = graph
      .connectedComponents()
      .map((component) => component.map((device) => device.id));

    expect(
      canComponents.some((component) => component.includes("coder-2")),
    ).toBe(true);
  });
});

describe("verifyRobotModel", () => {
  it("returns no diagnostics for a healthy baseline robot", () => {
    const result = verifyRobotModel(healthyModel());

    expect(result.hasErrors).toBe(false);
    expect(result.diagnostics).toEqual([]);
  });

  it("validates compatible port types, directions, and max connections", () => {
    const model = healthyModel();
    model.connections.push(
      {
        id: "bad-type",
        sourceDevice: "pdh-1",
        sourcePort: "channel_3",
        targetDevice: "rio-1",
        targetPort: "eth_0",
      },
      {
        id: "bad-direction",
        sourceDevice: "spark-1",
        sourcePort: "power_in",
        targetDevice: "pdh-1",
        targetPort: "channel_3",
      },
      {
        id: "too-many",
        sourceDevice: "pdh-1",
        sourcePort: "channel_1",
        targetDevice: "rio-1",
        targetPort: "power_in",
      },
    );

    const codes = verifyRobotModel(model).diagnostics.map(
      (diagnostic) => diagnostic.code,
    );

    expect(codes).toContain("INCOMPATIBLE_PORT_TYPES");
    expect(codes).toContain("INVALID_SOURCE_DIRECTION");
    expect(codes).toContain("MAX_CONNECTIONS_EXCEEDED");
  });

  it("validates required power, CAN, and Ethernet connections", () => {
    const model = healthyModel();
    model.connections = model.connections.filter(
      (connection) =>
        connection.id !== "pdh-spark-power" &&
        connection.id !== "spark-coder-can" &&
        connection.id !== "radio-limelight-eth",
    );

    const codes = verifyRobotModel(model).diagnostics.map(
      (diagnostic) => diagnostic.code,
    );

    expect(codes).toContain("REQUIRED_PORT_UNCONNECTED");
    expect(codes).toContain("POWER_NOT_REACHABLE");
    expect(codes).toContain("CAN_NOT_REACHABLE");
    expect(codes).toContain("NETWORK_NOT_REACHABLE");
  });

  it("verifies battery, radio, duplicate CAN IDs, and duplicate IP addresses", () => {
    const model = healthyModel();
    model.devices = model.devices
      .filter((device) => device.type !== "Battery" && device.type !== "Radio")
      .map((device) =>
        device.id === "spark-1"
          ? { ...device, metadata: { canId: 3 } }
          : device.id === "limelight-1"
            ? { ...device, metadata: { ipAddress: "10.6.91.2" } }
            : device,
      );
    model.connections = model.connections.filter(
      (connection) =>
        connection.sourceDevice !== "battery-1" &&
        connection.sourceDevice !== "radio-1",
    );

    const codes = verifyRobotModel(model).diagnostics.map(
      (diagnostic) => diagnostic.code,
    );

    expect(codes).toContain("BATTERY_MISSING");
    expect(codes).toContain("RADIO_MISSING");
    expect(codes).toContain("DUPLICATE_CAN_ID");
    expect(codes).toContain("DUPLICATE_IP_ADDRESS");
  });

  it("runs custom verification passes through the diagnostic collection", () => {
    const pass: VerificationPass = {
      id: "custom-pass",
      run: () => [
        {
          id: "custom-1",
          severity: Severity.WARNING,
          message: "Custom warning",
          code: "CUSTOM_WARNING",
        },
      ],
    };

    const result = verifyRobotModel(healthyModel(), { passes: [pass] });
    const collection = new DiagnosticCollection();
    collection.addMany(result.diagnostics);

    expect(result.diagnostics).toHaveLength(1);
    expect(collection.hasErrors()).toBe(false);
  });
});
