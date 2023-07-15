import * as antdIcons from '@ant-design/icons';
import * as formilyAntdV5 from '@formily/antd-v5';
import * as formilyCore from '@formily/core';
import * as formilyJsonSchema from '@formily/json-schema';
import * as formilyReact from '@formily/react';
import * as formilyJsonReactive from '@formily/reactive';
import * as formilyShared from '@formily/shared';
import * as nocobaseEvaluators from '@nocobase/evaluators/client';
import * as nocobaseClientUtils from '@nocobase/utils/client';
import * as antd from 'antd';
import * as antdStyle from 'antd-style';
import * as i18next from 'i18next';
import React from 'react';
import ReactDOM from 'react-dom';
import * as reactI18next from 'react-i18next';
import * as ReactRouterDom from 'react-router-dom';
import * as nocobaseClient from '../../index';
import { getRequireJs } from './requirejs';

import type { Plugin } from '../Plugin';
import { PluginData } from '../PluginManager';

export function initDeps(requirejs: any) {
  // react
  requirejs.define('react', () => React);
  requirejs.define('react-dom', () => ReactDOM);

  // react-router
  requirejs.define('react-router-dom', () => ReactRouterDom);

  // antd
  requirejs.define('antd', () => antd);
  requirejs.define('antd-style', () => antdStyle);
  requirejs.define('@ant-design/icons', () => antdIcons);

  // i18next
  requirejs.define('i18next', () => i18next);
  requirejs.define('react-i18next', () => reactI18next);

  // formily
  requirejs.define('@formily/antd-v5', () => formilyAntdV5);
  requirejs.define('@formily/core', () => formilyCore);
  requirejs.define('@formily/react', () => formilyReact);
  requirejs.define('@formily/shared', () => formilyShared);
  requirejs.define('@formily/json-schema', () => formilyJsonSchema);
  requirejs.define('@formily/reactive', () => formilyJsonReactive);

  // nocobase
  requirejs.define('@nocobase/utils', () => nocobaseClientUtils);
  requirejs.define('@nocobase/client', () => nocobaseClient);
  requirejs.define('@nocobase/evaluators', () => nocobaseEvaluators);
}

export function getPlugins(pluginData: PluginData[]): Promise<(typeof Plugin)[]> {
  if (pluginData.length === 0) return Promise.resolve([]);
  // if (process.env.NODE_ENV === 'development') {
  //   return Promise.all(
  //     packageNames.map((packageName) => import(`${packageName}/client`).then((item) => item.default || item)),
  //   );
  // }

  const requirejs: any = getRequireJs();
  (window as any).define = requirejs.define;
  initDeps(requirejs);
  requirejs.requirejs.config({
    paths: pluginData.reduce<Record<string, string>>((memo, item) => {
      memo[item.packageName] = item.url;
      return memo;
    }, {}),
  });

  return new Promise<(typeof Plugin)[]>((resolve) => {
    requirejs.requirejs(
      pluginData.map((item) => item.packageName),
      (...plugins: (typeof Plugin & { default?: typeof Plugin })[]) => {
        resolve(plugins.map((item) => item.default || item));
      },
    );
  });
}
