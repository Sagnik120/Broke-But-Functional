import { useMemo } from 'react';
import { buildSuggestions } from '@/engine/insights';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';

interface SmartMovesProps {
  className?: string;
  onSimulate: () => void;
}

/** Suggestions whose numbers come from running each move through the simulator. */
export function SmartMoves({ className, onSimulate }: SmartMovesProps) {
  const { state, snapshot } = useFinance();
  const suggestions = useMemo(() => buildSuggestions(state, snapshot), [state, snapshot]);

  return (
    <section className={cn('card', className)} aria-labelledby="moves-heading">
      <h2 id="moves-heading" className="card__title">
        Smart moves
      </h2>
      {suggestions.length > 0 ? (
        <ul className="moves">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="moves__item" data-tone={suggestion.tone}>
              {suggestion.text}
            </li>
          ))}
        </ul>
      ) : (
        <p>You're on track. Nothing needs fixing today.</p>
      )}
      <p>
        <button type="button" className="button button--ghost" onClick={onSimulate}>
          Try one in the simulator
        </button>
      </p>
    </section>
  );
}
