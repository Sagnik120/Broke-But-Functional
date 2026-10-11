import { useContext } from 'react';
import { FinanceContext, type FinanceContextValue } from '@/context/finance-context';

export function useFinance(): FinanceContextValue {
  const value = useContext(FinanceContext);
  if (value === null) throw new Error('useFinance must be used inside <FinanceProvider>.');
  return value;
}
