import { useEffect, useState } from 'react';
import type { Route } from '../lib/route';
import { parseRoute } from '../lib/route';

/** The current route, kept in step with the address bar's back and forward. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    // replaceState doesn't fire hashchange, so re-read on popstate as well.
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return route;
}
