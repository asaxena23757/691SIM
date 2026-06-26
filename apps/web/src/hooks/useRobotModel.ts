/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react';
import type { Connection, DeviceInstance, RobotModel } from '@691sim/core';
import { createDefaultDeviceRegistry } from '@691sim/registry';
import { verifyRobotModel, buildGraph } from '@691sim/verifier';
import { exportProject, importProject, validateProject } from '@691sim/serialization';
import { createEmptyModel, nextConnectionId, nextDeviceId } from '../utils/labels';

export type SelectedPort = {
  deviceId: string;
  portId: string;
};

export function useRobotModel(initial: RobotModel) {
  const [model, setModel] = useState<RobotModel>(initial);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [highlightDeviceIds, setHighlightDeviceIds] = useState<string[]>([]);
  const [pendingPort, setPendingPort] = useState<SelectedPort | null>(null);

  const registry = useMemo(() => createDefaultDeviceRegistry(), []);

  const verification = useMemo(() => verifyRobotModel(model, { registry }), [model, registry]);

  const graph = useMemo(() => {
    try {
      return buildGraph(model, { registry });
    } catch {
      return null;
    }
  }, [model, registry]);

  const selectedDevice = useMemo(
    () => model.devices.find((d: any) => d.id === selectedDeviceId) ?? null,
    [model.devices, selectedDeviceId],
  );

  const selectedDefinition = useMemo(() => {
    if (!selectedDevice) return null;
    return registry.get(selectedDevice.type) ?? null;
  }, [registry, selectedDevice]);

  const updateModel = useCallback((updater: (prev: RobotModel) => RobotModel) => {
    setModel((prev: any) => updater(prev));
  }, []);

  const newProject = useCallback((name?: string) => {
    setModel(createEmptyModel(name));
    setSelectedDeviceId(null);
    setSelectedConnectionId(null);
    setPendingPort(null);
    setHighlightDeviceIds([]);
  }, []);

  const loadSample = useCallback((sample: RobotModel) => {
    setModel(sample);
    setSelectedDeviceId(null);
    setSelectedConnectionId(null);
    setPendingPort(null);
    setHighlightDeviceIds([]);
  }, []);

  const loadFromJson = useCallback((json: string) => {
    const loaded = importProject(json);
    setModel(loaded);
    setSelectedDeviceId(null);
    setSelectedConnectionId(null);
    setPendingPort(null);
    setHighlightDeviceIds([]);
    return loaded;
  }, []);

  const exportJson = useCallback(() => exportProject(model), [model]);

  const addDevice = useCallback(
    (type: string, position?: { x: number; y: number }) => {
      const id = nextDeviceId(type, model.devices);
      const def = registry.get(type);
      const instance: DeviceInstance = {
        id,
        type,
        label: def?.displayName ?? type,
        position: position ?? {
          x: 80 + (model.devices.length % 4) * 180,
          y: 80 + Math.floor(model.devices.length / 4) * 140,
        },
      };
      updateModel((prev) => ({
        ...prev,
        devices: [...prev.devices, instance],
      }));
      setSelectedDeviceId(id);
      setSelectedConnectionId(null);
    },
    [model.devices, registry, updateModel],
  );

  const removeDevice = useCallback(
    (deviceId: string) => {
      updateModel((prev) => ({
        ...prev,
        devices: prev.devices.filter((d: any) => d.id !== deviceId),
        connections: prev.connections.filter(
          (c: any) => c.sourceDevice !== deviceId && c.targetDevice !== deviceId,
        ),
      }));
      if (selectedDeviceId === deviceId) setSelectedDeviceId(null);
      setPendingPort(null);
    },
    [selectedDeviceId, updateModel],
  );

  const updateDevice = useCallback(
    (deviceId: string, patch: Partial<DeviceInstance>) => {
      updateModel((prev) => ({
        ...prev,
        devices: prev.devices.map((d: any) =>
          d.id === deviceId ? { ...d, ...patch, metadata: { ...d.metadata, ...patch.metadata } } : d,
        ),
      }));
    },
    [updateModel],
  );

  const moveDevice = useCallback(
    (deviceId: string, position: { x: number; y: number }) => {
      updateModel((prev) => ({
        ...prev,
        devices: prev.devices.map((d: any) => (d.id === deviceId ? { ...d, position } : d)),
      }));
    },
    [updateModel],
  );

  const addConnection = useCallback(
    (source: SelectedPort, target: SelectedPort) => {
      const connection: Connection = {
        id: nextConnectionId(model.connections),
        sourceDevice: source.deviceId,
        sourcePort: source.portId,
        targetDevice: target.deviceId,
        targetPort: target.portId,
      };
      updateModel((prev) => ({
        ...prev,
        connections: [...prev.connections, connection],
      }));
      setPendingPort(null);
    },
    [model.connections, updateModel],
  );

  const removeConnection = useCallback(
    (connectionId: string) => {
      updateModel((prev) => ({
        ...prev,
        connections: prev.connections.filter((c: any) => c.id !== connectionId),
      }));
      if (selectedConnectionId === connectionId) setSelectedConnectionId(null);
    },
    [selectedConnectionId, updateModel],
  );

  const handlePortClick = useCallback(
    (deviceId: string, portId: string) => {
      if (!pendingPort) {
        setPendingPort({ deviceId, portId });
        setSelectedDeviceId(deviceId);
        return;
      }
      if (pendingPort.deviceId === deviceId && pendingPort.portId === portId) {
        setPendingPort(null);
        return;
      }
      addConnection(pendingPort, { deviceId, portId });
    },
    [addConnection, pendingPort],
  );

  const focusDiagnostic = useCallback((deviceIds?: string[], connectionIds?: string[]) => {
    setHighlightDeviceIds(deviceIds ?? []);
    if (deviceIds?.[0]) setSelectedDeviceId(deviceIds[0]);
    if (connectionIds?.[0]) setSelectedConnectionId(connectionIds[0]);
  }, []);

  const validateCurrent = useCallback(() => validateProject(model), [model]);

  return {
    model,
    setModel,
    registry,
    verification,
    graph,
    selectedDeviceId,
    setSelectedDeviceId,
    selectedConnectionId,
    setSelectedConnectionId,
    selectedDevice,
    selectedDefinition,
    highlightDeviceIds,
    pendingPort,
    setPendingPort,
    newProject,
    loadSample,
    loadFromJson,
    exportJson,
    addDevice,
    removeDevice,
    updateDevice,
    moveDevice,
    addConnection,
    removeConnection,
    handlePortClick,
    focusDiagnostic,
    validateCurrent,
  };
}

export type RobotModelState = ReturnType<typeof useRobotModel>;
