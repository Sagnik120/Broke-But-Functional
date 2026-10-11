import { GoalsPanel } from '@/components/plans/GoalsPanel';
import { ScheduledPanel } from '@/components/plans/ScheduledPanel';

export default function Plans() {
  return (
    <div className="grid-2 grid-2--top">
      <GoalsPanel />
      <ScheduledPanel />
    </div>
  );
}
