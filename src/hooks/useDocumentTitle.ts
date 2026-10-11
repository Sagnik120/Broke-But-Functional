import { useEffect } from 'react';

/** Keeps the browser tab title in step with the current view. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
