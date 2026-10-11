import { memo } from 'react';
import { HEALTH_LABELS } from '../../domain/constants';
import type { HealthGrade } from '../../domain/types';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface HealthGaugeProps {
  score: number;
  grade: HealthGrade;
}

export const HealthGauge = memo(function HealthGauge({ score, grade }: HealthGaugeProps) {
  const filled = (CIRCUMFERENCE * score) / 100;
  return (
    <div className="gauge" data-grade={grade}>
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Financial health score ${score} out of 100: ${HEALTH_LABELS[grade]}`}
      >
        <circle className="gauge__track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="gauge__value"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          transform="rotate(-90 60 60)"
        />
        <text className="gauge__score" x="60" y="60" textAnchor="middle" dominantBaseline="central">
          {score}
        </text>
      </svg>
      <p className="gauge__label">{HEALTH_LABELS[grade]}</p>
    </div>
  );
});
