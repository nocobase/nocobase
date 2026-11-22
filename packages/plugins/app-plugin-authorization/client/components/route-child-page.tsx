import {
  RouteChildPageHostContext,
  type RouteChildPageHostValue,
} from '@nocobase/app-client/route-containers';
import {
  useContext,
  useLayoutEffect,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from 'cn';

export interface RouteChildPageProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * The content of a route that declares a `child-page` presentation. The application opens the layer that covers the
 * page beneath, and asks before discarding unsaved input in it; this component only hands that layer its content and
 * `className`. Rendered outside such a layer, as in a focused test, it is an ordinary page.
 */
export function RouteChildPage(props: RouteChildPageProps): ReactElement {
  const host = useContext(RouteChildPageHostContext);
  if (host) return <HostedRouteChildPage host={host} {...props} />;
  return (
    <div className={cn('flex flex-col gap-6', props.className)}>
      {props.children}
    </div>
  );
}

function HostedRouteChildPage({
  host,
  children,
  className,
}: RouteChildPageProps & {
  readonly host: RouteChildPageHostValue;
}): ReactElement {
  useLayoutEffect(() => {
    host.configure({ className });
    return () => host.configure({});
  }, [host, className]);
  return (
    <RouteChildPageHostContext.Provider value={null}>
      {children}
    </RouteChildPageHostContext.Provider>
  );
}
