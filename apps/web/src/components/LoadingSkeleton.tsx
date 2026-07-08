interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`skeleton-wrap ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: `${88 - (i % 3) * 14}%`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

interface LoadingPulseProps {
  label?: string;
}

export function LoadingPulse({ label = 'Working…' }: LoadingPulseProps) {
  return (
    <div className="loading-pulse" aria-live="polite">
      <span className="loading-pulse-dot" />
      <span className="loading-pulse-dot" />
      <span className="loading-pulse-dot" />
      <span className="loading-pulse-label">{label}</span>
    </div>
  );
}
