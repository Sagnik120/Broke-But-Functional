import { CalendarClock, PiggyBank, ReceiptText, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { isUpcoming } from '@/engine/ledger';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';
import { formatINR, formatPercent } from '@/utils/format';

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: number;
  note: string;
  tone?: 'good' | 'bad';
  className?: string;
}

function Stat({ icon: Icon, label, value, note, tone, className }: StatProps) {
  return (
    <div className={cn('stat', className)} data-tone={tone}>
      <dt className="flex items-center gap-2">
        <Icon size={16} aria-hidden="true" />
        {label}
      </dt>
      <dd className="stat__value">
        <AnimatedNumber value={value} />
      </dd>
      <dd className="stat__note">{note}</dd>
    </div>
  );
}

/** Five connected figures: two columns on phones, three on tablets, one row on desktops. */
export function StatsGrid({ className }: { className?: string }) {
  const { state, snapshot } = useFinance();
  const upcomingCount = state.scheduled.filter((payment) => isUpcoming(payment, state.currentDay)).length;

  return (
    <section className={className} aria-labelledby="numbers-heading">
      <h2 id="numbers-heading" className="section-title">
        Your month in numbers
      </h2>
      <dl className="stats grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
        <Stat
          icon={Wallet}
          label="Remaining balance"
          value={snapshot.balance}
          note={`of ${formatINR(snapshot.income)} income`}
          tone={snapshot.balance < 0 ? 'bad' : undefined}
        />
        <Stat
          icon={ReceiptText}
          label="Spent so far"
          value={snapshot.spent + snapshot.scheduledPaid}
          note={`about ${formatINR(snapshot.burnRate)} a day on everyday stuff`}
        />
        <Stat
          icon={CalendarClock}
          label="Upcoming commitments"
          value={snapshot.upcoming}
          note={`${upcomingCount} ${upcomingCount === 1 ? 'payment' : 'payments'} still to come`}
          tone={snapshot.upcoming > snapshot.balance ? 'bad' : undefined}
        />
        <Stat
          icon={PiggyBank}
          label="Saved for goals"
          value={snapshot.saved}
          note={
            snapshot.goalsTarget > 0
              ? `${formatPercent(snapshot.goalProgress)} of ${formatINR(snapshot.goalsTarget)}`
              : 'No goals yet'
          }
          tone={snapshot.saved > 0 ? 'good' : undefined}
        />
        <Stat
          icon={TrendingUp}
          label="Month-end forecast"
          value={snapshot.projectedEnd}
          note={
            snapshot.shortfallDay === null
              ? 'left on day 30 at this pace'
              : `money runs out on day ${snapshot.shortfallDay}`
          }
          tone={snapshot.projectedEnd < 0 ? 'bad' : 'good'}
          className="col-span-2 sm:col-span-1"
        />
      </dl>
    </section>
  );
}
