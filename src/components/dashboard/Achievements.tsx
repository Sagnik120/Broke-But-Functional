import { Briefcase, Flame, PiggyBank, Scissors, ShieldCheck, Trophy, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { buildAchievements, type AchievementId } from '@/engine/achievements';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';

const ICONS: Record<AchievementId, LucideIcon> = {
  streak: Flame,
  saver: PiggyBank,
  'goal-getter': Trophy,
  'sub-slayer': Scissors,
  'side-hustler': Briefcase,
  'shock-absorber': ShieldCheck,
};

/** Badges earned from real behaviour in the ledger: streaks, savings, cancelled subscriptions. */
export function Achievements({ className }: { className?: string }) {
  const { state, snapshot } = useFinance();
  const achievements = useMemo(() => buildAchievements(state, snapshot), [state, snapshot]);
  const earned = achievements.filter((achievement) => achievement.earned).length;

  return (
    <section className={cn('card', className)} aria-labelledby="achievements-heading">
      <h2 id="achievements-heading" className="card__title">
        Achievements
      </h2>
      <p>
        {earned} of {achievements.length} unlocked this month.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {achievements.map((achievement) => {
          const Icon = ICONS[achievement.id];
          return (
            <li key={achievement.id} className="trophy" data-earned={achievement.earned}>
              <span className="trophy__icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{achievement.title}</span>
                <span className="block text-sm text-ink-2">{achievement.description}</span>
              </span>
              <span className="ml-auto text-xs font-bold tracking-wide uppercase">
                {achievement.earned ? 'Unlocked' : 'Locked'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
