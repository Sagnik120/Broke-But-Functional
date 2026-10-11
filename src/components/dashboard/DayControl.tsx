import { MONTH_DAYS } from '../../domain/constants';
import { earliestDay } from '../../domain/ledger';
import { useFinance } from '../../state/useFinance';

/** Moves the calendar so users can watch bills land and the forecast play out. */
export function DayControl() {
  const { state, dispatch, announce } = useFinance();
  const day = state.currentDay;
  const minDay = earliestDay(state);

  function goTo(next: number) {
    dispatch({ type: 'day/set', day: next });
    announce(`Now on day ${next} of ${MONTH_DAYS}.`);
  }

  return (
    <div className="day-control" role="group" aria-label="Current day of the month">
      <button
        type="button"
        className="button button--ghost"
        onClick={() => goTo(day - 1)}
        disabled={day <= minDay}
        aria-label="Go back one day"
      >
        <span aria-hidden="true">←</span>
      </button>
      <p className="day-control__label">
        Day{' '}
        <strong key={day} className="day-control__day">
          {day}
        </strong>{' '}
        of {MONTH_DAYS}
      </p>
      <button
        type="button"
        className="button button--ghost"
        onClick={() => goTo(day + 1)}
        disabled={day >= MONTH_DAYS}
        aria-label="Advance to the next day"
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
