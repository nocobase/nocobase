import React, { useCallback } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes: remoteRoutes = [] } = props;

  /**
   * 将 path 中的可选参数转换为多个路径
   *
   * @example
   * generatePaths('/a/b/:c?/:d?')
   * => ['/a/b', '/a/b/:c', '/a/b/:c/:d']
   */
  const generatePaths = useCallback((path = '') => {
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
          .replaceAll('?', '')
          .replaceAll('(.+)', ''), // 历史遗留问题 /a/b/:c(.+)? => /a/b/:c
      );
    }
    return res;
  }, []);

  const getRoutes = useCallback(
    (routes: RouteSwitchProps['routes']) => {
      const res = routes.map((item) => {
        if (item.type === 'route' && item.routes) {
          // layout
          return {
            element: (
              <RouteContext.Provider value={item}>
                <ComponentRenderer component={item.component} />
              </RouteContext.Provider>
            ),
            children: getRoutes(item.routes).flat(Infinity),
          };
        } else if (item.type === 'route' && item.path) {
          // common route
          return generatePaths(item.path).map((path) => ({
            path: path,
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
            path: item.from,
            element: <Navigate replace={!item.push} to={item.to} />,
          };
        }
      });
      return res;
    },
    [generatePaths],
  );

  const routers = useRoutes(getRoutes(remoteRoutes));
  return routers;
}

function ComponentRenderer(props) {
  const Component = useRouteComponent(props?.component);
  return <Component></Component>;
}
