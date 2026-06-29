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
import { ConnectionsPanel } from './components/ConnectionsPanel';
import { useRobotModel } from './hooks/useRobotModel';
import { createHealthyModel } from './utils/labels';

type Tab = 'editor' | 'registry' | 'json' | 'graph' | 'connections';

export default function App() {
  const state = useRobotModel(createHealthyModel());
  const [tab, setTab] = useState<Tab>('editor');
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
    void state.runVerification();
  };

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
        <button
          type="button"
          className={`tab ${tab === 'editor' ? 'active' : ''}`}
          onClick={() => setTab('editor')}
        >
          Editor
        </button>
        <button
          type="button"
          className={`tab ${tab === 'connections' ? 'active' : ''}`}
          onClick={() => setTab('connections')}
        >
          Wires
        </button>
        <button
          type="button"
          className={`tab ${tab === 'registry' ? 'active' : ''}`}
          onClick={() => setTab('registry')}
        >
          Device Registry
        </button>
        <button
          type="button"
          className={`tab ${tab === 'json' ? 'active' : ''}`}
          onClick={() => setTab('json')}
        >
          JSON
        </button>
        <button
          type="button"
          className={`tab ${tab === 'graph' ? 'active' : ''}`}
          onClick={() => setTab('graph')}
        >
          Graph Analysis
        </button>
      </div>

      {tab === 'editor' && (
        <div className="editor-layout">
          <WireLegend />
          <DiagnosticsPanel state={state} />
          <div className="app-body">
            <DevicePalette state={state} />
            <Canvas state={state} />
            <PropertiesPanel state={state} />
          </div>
        </div>
      )}

      {tab === 'connections' && (
        <div className="tab-panel">
          <ConnectionsPanel state={state} />
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
