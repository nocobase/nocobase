/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as antdCssinjs from '@ant-design/cssinjs';
import * as antdIcons from '@ant-design/icons';
import * as formilyCore from '@formily/core';
import * as formilyReact from '@formily/react';
import * as formilyReactive from '@formily/reactive';
import * as formilyShared from '@formily/shared';
import * as nocobaseFlowEngine from '@nocobase/flow-engine';
import * as antd from 'antd';
import * as i18next from 'i18next';
import React from 'react';
import ReactDOM from 'react-dom';
import * as reactI18next from 'react-i18next';
import * as ReactRouter from 'react-router';
import * as ReactRouterDom from 'react-router-dom';
import jsxRuntime from 'react/jsx-runtime';
import * as nocobaseClientV2 from '../index';

import type { RequireJS } from './requirejs';

/**
 * @internal
 */
export function defineGlobalDeps(requirejs: RequireJS) {
  // react
  requirejs.define('react', () => React);
  requirejs.define('react-dom', () => ReactDOM);
  requirejs.define('react/jsx-runtime', () => jsxRuntime);

  // react-router
  requirejs.define('react-router', () => ReactRouter);
  requirejs.define('react-router-dom', () => ReactRouterDom);

  // antd
  requirejs.define('antd', () => antd);
  requirejs.define('@ant-design/icons', () => antdIcons);
  requirejs.define('@ant-design/cssinjs', () => antdCssinjs);

  // i18next
  requirejs.define('i18next', () => i18next);
  requirejs.define('react-i18next', () => reactI18next);

  // formily
  requirejs.define('@formily/core', () => formilyCore);
  requirejs.define('@formily/react', () => formilyReact);
  requirejs.define('@formily/reactive', () => formilyReactive);
  requirejs.define('@formily/shared', () => formilyShared);

  // nocobase
  requirejs.define('@nocobase/client-v2', () => nocobaseClientV2);
  requirejs.define('@nocobase/client-v2/client-v2', () => nocobaseClientV2);
  requirejs.define('@nocobase/flow-engine', () => nocobaseFlowEngine);
}
