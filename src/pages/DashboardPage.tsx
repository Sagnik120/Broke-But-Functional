import { ForecastChart } from '@/components/charts/ForecastChart';
import { MonthMap } from '@/components/charts/MonthMap';
import { Achievements } from '@/components/dashboard/Achievements';
import { GoalsSummary } from '@/components/dashboard/GoalsSummary';
import { HealthCard } from '@/components/dashboard/HealthCard';
import { HeroCard } from '@/components/dashboard/HeroCard';
import { MonthTools } from '@/components/dashboard/MonthTools';
import { QuickCheck } from '@/components/dashboard/QuickCheck';
import { RiskCard } from '@/components/dashboard/RiskCard';
import { SmartMoves } from '@/components/dashboard/SmartMoves';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { UpcomingList } from '@/components/dashboard/UpcomingList';
import type { DecisionDraft } from '@/components/simulator/draft';
import { useFinance } from '@/hooks/useFinance';

interface DashboardPageProps {
  /** Opens the simulator, optionally with a decision already filled in. */
  onSimulate: (draft?: Partial<DecisionDraft>) => void;
}

/**
 * Overview: a bento grid that is one column on phones, six on tablets and
 * twelve on desktops. Every widget reads the same snapshot, so they always agree.
 */
export default function DashboardPage({ onSimulate }: DashboardPageProps) {
  const { snapshot } = useFinance();
  const openSimulator = () => onSimulate();

  return (
    <div className="bento">
      <HeroCard className="md:col-span-6 xl:col-span-6" onSimulate={openSimulator} />
      <HealthCard className="md:col-span-3 xl:col-span-3" />
      <RiskCard className="md:col-span-3 xl:col-span-3" />
      <StatsGrid className="md:col-span-6 xl:col-span-12" />
      <QuickCheck className="md:col-span-6 xl:col-span-6" onOpenSimulator={onSimulate} />
      <SmartMoves className="md:col-span-6 xl:col-span-6" onSimulate={openSimulator} />
      <section className="card md:col-span-6 xl:col-span-8" aria-labelledby="forecast-heading">
        <h2 id="forecast-heading" className="card__title">
          Monthly forecast
        </h2>
        <ForecastChart points={snapshot.forecast} today={snapshot.day} shortfallDay={snapshot.shortfallDay} />
      </section>
      <MonthMap className="md:col-span-6 xl:col-span-4" />
      <UpcomingList className="md:col-span-3 xl:col-span-4" />
      <GoalsSummary className="md:col-span-3 xl:col-span-4" />
      <Achievements className="md:col-span-6 xl:col-span-4" />
      <MonthTools className="md:col-span-6 xl:col-span-12" />
    </div>
  );
}
