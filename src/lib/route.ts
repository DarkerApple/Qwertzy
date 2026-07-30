/**
 * Hash routing, hand-rolled — four routes don't justify a router, and the hash
 * means GitHub Pages needs no 404 shim.
 *
 *   #/                 the years
 *   #/m/2026-07        a month's page
 *   #/guide            how it works
 *   #/settings         theme, accent, motion, sound
 *   #/plugins          community plugins, and how to write one
 *   #/secret           the secret notebook (locked until it isn't)
 *   #/secret/2026-07   a month of it
 */
export type Route =
  | { name: 'home' }
  | { name: 'month'; month: string }
  | { name: 'guide' }
  | { name: 'settings' }
  | { name: 'plugins' }
  | { name: 'secret'; month?: string };

const MONTH = /^\d{4}-\d{2}$/;

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (path[0] === 'guide') return { name: 'guide' };
  if (path[0] === 'settings') return { name: 'settings' };
  if (path[0] === 'plugins') return { name: 'plugins' };
  if (path[0] === 'secret') {
    return { name: 'secret', month: MONTH.test(path[1] ?? '') ? path[1] : undefined };
  }
  if (path[0] === 'm' && MONTH.test(path[1] ?? '')) return { name: 'month', month: path[1] };
  return { name: 'home' };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'month':
      return `#/m/${route.month}`;
    case 'guide':
      return '#/guide';
    case 'settings':
      return '#/settings';
    case 'plugins':
      return '#/plugins';
    case 'secret':
      return route.month ? `#/secret/${route.month}` : '#/secret';
    default:
      return '#/';
  }
}

/** Navigate without stacking a history entry per month you flick through. */
export function go(route: Route, replace = false): void {
  const hash = routeToHash(route);
  if (window.location.hash === hash) return;
  if (replace) window.history.replaceState(null, '', hash);
  else window.location.hash = hash;
}
