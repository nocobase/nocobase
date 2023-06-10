import React, { useCallback } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes: remoteRoutes = [], base } = props;
  /**
   * 将 path 中的可选参数转换为多个路径
   *
   * @example
   * generatePaths('/a/b/:c?/:d?')
   * => ['/a/b', '/a/b/:c', '/a/b/:c/:d']
   */
  const generatePaths = useCallback((path = '') => {
    if (path === '/') return [path];

    const segments: string[] = path.split('/'); // 将路径按照 '/' 分段
    if (segments[segments.length - 1] === '') {
      segments.pop(); // 最后一个字符是 '/'，将其弹出
    }
    let lastOptionsIndex = undefined;
    for (let i = segments.length - 1; i >= 0; i--) {
      if (!segments[i].endsWith('?')) {
        lastOptionsIndex = i; // 找到最后一个可选参数的位置
        break;
      }
    }

    if (lastOptionsIndex === undefined) return [path]; // 没有可选参数，直接返回原路径
    const res: string[] = [];
    for (let i = lastOptionsIndex; i < segments.length; i++) {
      res.push(
        segments
          .slice(0, i + 1)
          .join('/')
          .replace(/\?/g, '')
          .replace(/\(\.\+\)/g, ''), // 历史遗留问题 /a/b/:c(.+)? => /a/b/:c
      );
    }
    return res;
  }, []);

  const getPathWithBase = useCallback((path: string, base?: string) => {
    if (!base || path === undefined || path.startsWith('/')) return path;
    if (path === '') return base;
    return `${base.endsWith('/') ? base : base + '/'}${path.startsWith('/') ? path.slice(1) : path}`;
  }, []);

  const getRoutes = useCallback(
    (routes: RouteSwitchProps['routes'], base?: string) => {
      const res = routes.map((item) => {
        if (item.type === 'route' && item.routes) {
          // layout
          return {
            element: (
              <RouteContext.Provider value={item}>
                <ComponentRenderer component={item.component} />
              </RouteContext.Provider>
            ),
            children: getRoutes(item.routes, getPathWithBase(item.path, base)).flat(Infinity),
          };
        } else if (item.type === 'route') {
          // common route
          return generatePaths(getPathWithBase(item.path, base)).map((path) => ({
            path: getPathWithBase(path, base),
            caseSensitive: item.sensitive,
            element: (
              <RouteContext.Provider value={item}>
                <ComponentRenderer component={item.component} />
              </RouteContext.Provider>
            ),
          }));
        } else if (item.type === 'redirect') {
          // redirect route
          return {
            path: getPathWithBase(item.from, base),
            element: <Navigate replace={!item.push} to={getPathWithBase(item.to, base)} />,
          };
        }
      });
      return res.flat(Infinity);
    },
    [generatePaths, getPathWithBase],
  );

  const routers = useRoutes(getRoutes(remoteRoutes, base));
  return routers;
}

function ComponentRenderer(props) {
  const Component = useRouteComponent(props?.component);
  return <Component></Component>;
}
