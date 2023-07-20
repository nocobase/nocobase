import * as antdCssinjs from '@ant-design/cssinjs';
import * as antdIcons from '@ant-design/icons';
import * as dndKitAccessibility from '@dnd-kit/accessibility';
import * as dndKitCore from '@dnd-kit/core';
import * as dndKitModifiers from '@dnd-kit/modifiers';
import * as dndKitSortable from '@dnd-kit/sortable';
import * as dndKitUtilities from '@dnd-kit/utilities';
import * as formilyAntdV5 from '@formily/antd-v5';
import * as formilyCore from '@formily/core';
import * as formilyJsonSchema from '@formily/json-schema';
import * as formilyPath from '@formily/path';
import * as formilyReact from '@formily/react';
import * as formilyJsonReactive from '@formily/reactive';
import * as formilyReactiveReact from '@formily/reactive-react';
import * as formilyShared from '@formily/shared';
import * as formilyValidator from '@formily/validator';
import * as nocobaseEvaluators from '@nocobase/evaluators/client';
import * as nocobaseClientUtils from '@nocobase/utils/client';
import * as antd from 'antd';
import * as antdStyle from 'antd-style';
import axios from 'axios';
import dayjs from 'dayjs';
import * as i18next from 'i18next';
import React from 'react';
import ReactDOM from 'react-dom';
import * as reactI18next from 'react-i18next';
import * as ReactRouter from 'react-router';
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
  requirejs.define('react-router', () => ReactRouter);
  requirejs.define('react-router-dom', () => ReactRouterDom);

  // antd
  requirejs.define('antd', () => antd);
  requirejs.define('antd-style', () => antdStyle);
  requirejs.define('@ant-design/icons', () => antdIcons);
  requirejs.define('@ant-design/cssinjs', () => antdCssinjs);

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
  requirejs.define('@formily/path', () => formilyPath);
  requirejs.define('@formily/validator', () => formilyValidator);
  requirejs.define('@formily/reactive-react', () => formilyReactiveReact);

  // nocobase
  requirejs.define('@nocobase/utils', () => nocobaseClientUtils);
  requirejs.define('@nocobase/utils/client', () => nocobaseClientUtils);
  requirejs.define('@nocobase/client', () => nocobaseClient);
  requirejs.define('@nocobase/client/client', () => nocobaseClient);
  requirejs.define('@nocobase/evaluators', () => nocobaseEvaluators);
  requirejs.define('@nocobase/evaluators/client', () => nocobaseEvaluators);

  // dnd-kit 相关
  requirejs.define('@dnd-kit/accessibility', () => dndKitAccessibility);
  requirejs.define('@dnd-kit/core', () => dndKitCore);
  requirejs.define('@dnd-kit/modifiers', () => dndKitModifiers);
  requirejs.define('@dnd-kit/sortable', () => dndKitSortable);
  requirejs.define('@dnd-kit/utilities', () => dndKitUtilities);

  // utils
  requirejs.define('axios', () => axios);
  requirejs.define('dayjs', () => dayjs);
}

export function getRemotePlugins(pluginData: PluginData[] = [], baseURL = ''): Promise<(typeof Plugin)[]> {
  if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }
  if (baseURL.endsWith('/api')) {
    baseURL = baseURL.slice(0, -4);
  }

  const requirejs: any = getRequireJs();
  (window as any).define = requirejs.define;

  initDeps(requirejs);
  requirejs.requirejs.config({
    paths: pluginData.reduce<Record<string, string>>((memo, item) => {
      memo[item.packageName] = `${baseURL}${item.url}`;
      memo[`${item.packageName}/client`] = `${baseURL}${item.url}.js?client`;
      return memo;
    }, {}),
  });

  return new Promise((resolve, reject) => {
    requirejs.requirejs(
      pluginData.map((item) => item.packageName),
      (...plugins: (typeof Plugin & { default?: typeof Plugin })[]) => {
        resolve(plugins.map((item) => item.default || item));
      },
      reject
    );
  });
}

export async function getPlugins(
  pluginData: PluginData[],
  dynamicImport: any,
  baseURL: string,
): Promise<(typeof Plugin)[]> {
  if (pluginData.length === 0) return [];
  if (process.env.NODE_ENV === 'development' && !process.env.USER_REMOTE_PLUGIN) {
    const plugins = [];
    const localPlugins = pluginData.filter((item) => item.type === 'local');
    const remotePlugins = pluginData.filter((item) => item.type !== 'local');
    plugins.push(
      ...(await Promise.all(localPlugins.map((item) => dynamicImport(item.name).then((item) => item.default || item)))),
    );

    if (remotePlugins.length === 0) {
      return plugins;
    } else {
      const remotePluginList = await getRemotePlugins(remotePlugins, baseURL);
      plugins.push(...remotePluginList);
      return plugins;
    }
  }

  return getRemotePlugins(pluginData, baseURL);
}
