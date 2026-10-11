import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/** Reassures the user that the app keeps working, and saving, without a connection. */
export function OfflineNotice() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-warn-bg px-3 py-1 text-sm font-semibold text-warn">
      <WifiOff size={16} aria-hidden="true" />
      Offline. Changes are saved on this device.
    </p>
  );
}
