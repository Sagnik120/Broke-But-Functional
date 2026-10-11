/** The app's views. `slug` is the URL hash segment, so every view is linkable and the back button works. */
export const ROUTES = [
  { id: 'overview', slug: '', label: 'Overview', title: 'Overview' },
  { id: 'simulate', slug: 'simulate', label: 'What if?', title: 'What-if simulator' },
  { id: 'activity', slug: 'activity', label: 'Activity', title: 'Activity' },
  { id: 'plans', slug: 'plans', label: 'Plans', title: 'Plans' },
] as const;

export type RouteId = (typeof ROUTES)[number]['id'];

export const DEFAULT_ROUTE: RouteId = 'overview';

export const APP_NAME = 'Broke But Functional';
