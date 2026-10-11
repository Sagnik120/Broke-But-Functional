import { formatINR } from '../../domain/format';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
}

/** A figure that counts from its previous value to the new one when it changes. */
export function AnimatedNumber({ value, format = formatINR }: AnimatedNumberProps) {
  return <>{format(useAnimatedNumber(value))}</>;
}
