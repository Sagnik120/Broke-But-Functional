/** Placeholder shown while a lazily loaded view downloads; mirrors the two-card layout. */
export function PanelSkeleton() {
  return (
    <div className="grid-2" aria-busy="true">
      <span className="sr-only">Loading view…</span>
      <div className="card skeleton-card" aria-hidden="true">
        <span className="skeleton skeleton--title" />
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton skeleton--short" />
      </div>
      <div className="card skeleton-card" aria-hidden="true">
        <span className="skeleton skeleton--title" />
        <span className="skeleton" />
        <span className="skeleton skeleton--short" />
      </div>
    </div>
  );
}
