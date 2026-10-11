import { GoalsPanel } from './GoalsPanel';
import { ScheduledPanel } from './ScheduledPanel';

export default function Plans() {
  return (
    <div className="grid-2 grid-2--top">
      <GoalsPanel />
      <ScheduledPanel />
    </div>
  );
}
