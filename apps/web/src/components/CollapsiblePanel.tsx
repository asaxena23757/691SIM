import type { ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  side?: 'left' | 'right' | 'bottom';
  badge?: ReactNode;
}

export function CollapsiblePanel({
  title,
  collapsed,
  onToggle,
  children,
  className = '',
  side = 'left',
  badge,
}: CollapsiblePanelProps) {
  return (
    <aside
      className={`panel collapsible-panel collapsible-${side} ${collapsed ? 'collapsed' : ''} ${className}`}
    >
      <button type="button" className="panel-header collapsible-header" onClick={onToggle}>
        <span className="collapse-chevron">{collapsed ? '▸' : '▾'}</span>
        <span>{title}</span>
        {badge && <span className="collapsible-badge">{badge}</span>}
      </button>
      {!collapsed && <div className="panel-content collapsible-body">{children}</div>}
    </aside>
  );
}
