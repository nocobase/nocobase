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
import jsxRuntime from 'react/jsx-runtime';
import * as nocobaseClient from '../../index';
import { getRequireJs } from './requirejs';

import type { Plugin } from '../Plugin';
import { PluginData } from '../PluginManager';

export function initDeps(requirejs: any) {
  // react
  requirejs.define('react', () => React);
  requirejs.define('react-dom', () => ReactDOM);
  requirejs.define('react/jsx-runtime', () => jsxRuntime);

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
  requirejs.define('@nocobase/utils/client', () => nocobaseClientUtils);
  requirejs.define('@nocobase/client', () => nocobaseClient);
  requirejs.define('@nocobase/client/client', () => nocobaseClient);
  requirejs.define('@nocobase/evaluators', () => nocobaseEvaluators);
  requirejs.define('@nocobase/evaluators/client', () => nocobaseEvaluators);
}

export function getRemotePlugins(pluginData: PluginData[] = []): Promise<(typeof Plugin)[]> {
  const requirejs: any = getRequireJs();
  (window as any).define = requirejs.define;

  initDeps(requirejs);
  requirejs.requirejs.config({
    paths: pluginData.reduce<Record<string, string>>((memo, item) => {
      memo[item.packageName] = item.url;
      memo[`${item.packageName}/client`] = `${item.url}.js?client`;
      return memo;
    }, {}),
  });

  return new Promise((resolve) => {
    requirejs.requirejs(
      pluginData.map((item) => item.packageName),
      (...plugins: (typeof Plugin & { default?: typeof Plugin })[]) => {
        resolve(plugins.map((item) => item.default || item));
      },
    );
  });
}

export async function getPlugins(pluginData: PluginData[], dynamicImport: any): Promise<(typeof Plugin)[]> {
  if (pluginData.length === 0) return [];
  const plugins = [];

  if (process.env.NODE_ENV === 'development') {
    const localPlugins = pluginData.filter((item) => item.type === 'local');
    const remotePlugins = pluginData.filter((item) => item.type !== 'local');
    plugins.push(
      ...(await Promise.all(localPlugins.map((item) => dynamicImport(item.name).then((item) => item.default || item)))),
    );

    if (remotePlugins.length === 0) {
      return plugins;
    } else {
      const remotePluginList = await getRemotePlugins(remotePlugins);
      plugins.push(...remotePluginList);
      return plugins;
    }
  }

  return getRemotePlugins(pluginData);
}
