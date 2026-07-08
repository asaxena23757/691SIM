import { useRef, useState, type ChangeEvent } from 'react';
import './App.css';
import { WireLegend } from './components/WireLegend';
import { Header } from './components/Header';
import { DevicePalette } from './components/DevicePalette';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { RegistryExplorer } from './components/RegistryExplorer';
import { JsonPanel } from './components/JsonPanel';
import { GraphPanel } from './components/GraphPanel';
import { SimulationPanel } from './components/SimulationPanel';
import { CollapsiblePanel } from './components/CollapsiblePanel';
import { useRobotModel } from './hooks/useRobotModel';
import { createHealthyModel } from './utils/labels';

type Tab = 'editor' | 'simulation' | 'registry' | 'json' | 'graph';

const TAB_HINTS: Record<Tab, string> = {
  editor: 'Place devices, wire ports together, and verify your robot circuit.',
  simulation: 'Run the physics engine: live voltage, brownout risk, wire ampacity, and CAN topology.',
  registry: 'Browse built-in FRC device specs, ports, and requirements.',
  json: 'Import, export, or hand-edit the project JSON file.',
  graph: 'See power, CAN, network reachability, and load estimations.',
};

export default function App() {
  const state = useRobotModel(createHealthyModel());
  const [tab, setTab] = useState<Tab>('editor');
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [diagnosticsCollapsed, setDiagnosticsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenFile = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.loadFromJson(String(reader.result));
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveFile = () => {
    try {
      const json = state.exportJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.model.name.replace(/\s+/g, '-').toLowerCase()}.691sim.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleVerify = () => {
    setTab('editor');
    setDiagnosticsCollapsed(false);
    void state.runVerification();
  };

  const bodyClass = [
    'app-body',
    paletteCollapsed ? 'palette-collapsed' : '',
    propertiesCollapsed ? 'properties-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.691sim,application/json"
        hidden
        onChange={handleFileChange}
      />

      <Header
        state={state}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onLoadSample={() => state.loadSample(createHealthyModel())}
        onVerify={handleVerify}
      />

      <div className="tabs">
        {(
          [
            ['editor', 'Editor'],
            ['simulation', 'Simulation'],
            ['registry', 'Device Registry'],
            ['json', 'JSON'],
            ['graph', 'Graph Analysis'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
            title={TAB_HINTS[id]}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'editor' && (
        <div className="editor-layout">
          {state.simulation?.voltage.brownoutRisk && (
            <div className="sim-alert sim-alert-danger sim-banner">
              ⚠ ROBORIO BROWNOUT RISK DETECTED — system sags to{' '}
              {state.simulation.voltage.systemVoltage.toFixed(2)} V. Open the Simulation tab for
              details.
            </div>
          )}
          <WireLegend />
          <div className={bodyClass}>
            <CollapsiblePanel
              title="Device Palette"
              collapsed={paletteCollapsed}
              onToggle={() => setPaletteCollapsed((v) => !v)}
              side="left"
            >
              <DevicePalette state={state} />
            </CollapsiblePanel>
            <Canvas state={state} />
            <CollapsiblePanel
              title="Properties"
              collapsed={propertiesCollapsed}
              onToggle={() => setPropertiesCollapsed((v) => !v)}
              side="right"
            >
              <PropertiesPanel state={state} />
            </CollapsiblePanel>
          </div>
          <DiagnosticsPanel
            state={state}
            collapsed={diagnosticsCollapsed}
            onToggle={() => setDiagnosticsCollapsed((v) => !v)}
          />
        </div>
      )}

      {tab === 'simulation' && (
        <div className="tab-panel">
          <SimulationPanel state={state} />
        </div>
      )}

      {tab === 'registry' && (
        <div className="tab-panel">
          <RegistryExplorer state={state} />
        </div>
      )}

      {tab === 'json' && (
        <div className="tab-panel">
          <JsonPanel state={state} />
        </div>
      )}

      {tab === 'graph' && (
        <div className="tab-panel">
          <GraphPanel state={state} />
        </div>
      )}
    </div>
  );
}
