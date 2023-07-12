import * as antdIcons from '@ant-design/icons';
import * as formilyAntdV5 from '@formily/antd-v5';
import * as formilyCore from '@formily/core';
import * as formilyJsonSchema from '@formily/json-schema';
import * as formilyReact from '@formily/react';
import * as formilyJsonReactive from '@formily/reactive';
import * as formilyShared from '@formily/shared';
import * as nocobaseClientUtils from '@nocobase/utils/client';
import * as antd from 'antd';
import * as antdStyle from 'antd-style';
import * as i18next from 'i18next';
import React from 'react';
import ReactDOM from 'react-dom';
import * as reactI18next from 'react-i18next';
import * as ReactRouterDom from 'react-router-dom';
import * as nocobaseClient from '../../index';

import 'requirejs';

import type { Plugin } from '../Plugin';

declare const requirejsVars: {
  requirejs: Require;
  require: Require;
  define: RequireDefine;
};

export function initDeps() {
  // react
  requirejsVars.define('react', () => React);
  requirejsVars.define('react-dom', () => ReactDOM);

  // react-router
  requirejsVars.define('react-router-dom', () => ReactRouterDom);

  // antd
  requirejsVars.define('antd', () => antd);
  requirejsVars.define('antd-style', () => antdStyle);
  requirejsVars.define('@ant-design/icons', () => antdIcons);

  // i18next
  requirejsVars.define('i18next', () => i18next);
  requirejsVars.define('react-i18next', () => reactI18next);

  // formily
  requirejsVars.define('@formily/antd-v5', () => formilyAntdV5);
  requirejsVars.define('@formily/core', () => formilyCore);
  requirejsVars.define('@formily/react', () => formilyReact);
  requirejsVars.define('@formily/shared', () => formilyShared);
  requirejsVars.define('@formily/json-schema', () => formilyJsonSchema);
  requirejsVars.define('@formily/reactive', () => formilyJsonReactive);

  // nocobase
  requirejsVars.define('@nocobase/utils', () => nocobaseClientUtils);
  requirejsVars.define('@nocobase/client', () => nocobaseClient);
}

export function getPlugins(pluginsUrls: Record<string, string>): Promise<(typeof Plugin)[]> {
  requirejsVars.requirejs.config({
    paths: pluginsUrls,
  });

  return new Promise((resolve) => {
    requirejsVars.requirejs(Object.keys(pluginsUrls), (...plugins: (typeof Plugin)[]) => {
      resolve(plugins);
    });
  });
}
