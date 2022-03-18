export interface RedirectProps {
  type: 'redirect';
  to: any;
  path?: string;
  exact?: boolean;
  strict?: boolean;
  push?: boolean;
  from?: string;
  [key: string]: any;
}

export interface RouteProps {
  type: 'route';
  path?: string | string[];
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
  component?: any;
  routes?: RouteProps[];
  [key: string]: any;
}

export interface RouteSwitchProviderProps {
  components?: any;
  children?: any;
  routes?: RouteRedirectProps[];
}

export type RouteRedirectProps = RedirectProps | RouteProps;

export interface RouteSwitchProps {
  routes?: RouteRedirectProps[];
  components?: any;
}
