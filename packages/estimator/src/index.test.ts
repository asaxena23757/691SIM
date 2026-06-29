import { createHealthyRobotModel } from "@691sim/core";
import { describe, expect, it } from "vitest";
import { estimateRobotModel } from "./index.js";

describe("estimateRobotModel", () => {
  it("estimates current, weight, and CAN utilization for a healthy robot", () => {
    const result = estimateRobotModel(createHealthyRobotModel());

    expect(result.nominalCurrentAmps).toBeGreaterThan(0);
    expect(result.peakCurrentAmps).toBeGreaterThanOrEqual(result.nominalCurrentAmps);
    expect(result.totalWeightLbs).toBeGreaterThan(0);
    expect(result.canDeviceCount).toBeGreaterThan(0);
    expect(result.canUtilizationPercent).toBeGreaterThan(0);
    expect(result.estimatedVoltageUnderLoad).toBeLessThan(12);
    expect(["low", "medium", "high"]).toContain(result.brownoutRisk);
  });
});
