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
import * as antdStyle from 'antd-style';
import * as ctrlTinycolor from '@ctrl/tinycolor';
import * as emotionCss from '@emotion/css';
import * as formilyAntdV5 from '@formily/antd-v5';
import * as formilyCore from '@formily/core';
import * as formilyReact from '@formily/react';
import * as formilyReactive from '@formily/reactive';
import * as formilyShared from '@formily/shared';
import * as nocobaseEvaluators from '@nocobase/evaluators/client';
import * as nocobaseClientUtils from '@nocobase/utils/client';
import { dayjs } from '@nocobase/utils/client';
import * as nocobaseFlowEngine from '@nocobase/flow-engine';
import * as ahooks from 'ahooks';
import * as antd from 'antd';
import * as FileSaver from 'file-saver';
import axios from 'axios';
import * as i18next from 'i18next';
import lodash from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import * as reactI18next from 'react-i18next';
import * as ReactRouter from 'react-router';
import * as ReactRouterDom from 'react-router-dom';
import jsxRuntime from 'react/jsx-runtime';

// react/jsx-dev-runtime conditionally loads production or development builds
// based on NODE_ENV. In production builds, jsxDEV is undefined. Since plugin dev
// servers compile JSX with jsxDEV calls even when the host app is built in
// production mode, we must ensure jsxDEV is always available. Fall back to jsx
// from the production runtime when the dev export is missing.
import jsxDevRuntimeRaw from 'react/jsx-dev-runtime';
const jsxDevRuntime =
  typeof jsxDevRuntimeRaw?.jsxDEV === 'function' ? jsxDevRuntimeRaw : { ...jsxDevRuntimeRaw, jsxDEV: jsxRuntime?.jsx };
import * as nocobaseClientV2 from '../index';
import * as dndKitCore from '@dnd-kit/core';
import * as dndKitSortable from '@dnd-kit/sortable';
import type { RequireJS } from './requirejs';

declare global {
  interface Window {
    __nocobase_app_dev__?: boolean;
    __nocobase_app_dev_deps__?: Record<string, unknown>;
    __nocobase_app_dev_plugins__?: Record<string, unknown>;
  }
}

function defineGlobalDep(requirejs: RequireJS, name: string, value: unknown) {
  requirejs.define(name, () => value);
  if (window.__nocobase_app_dev__) {
    window.__nocobase_app_dev_deps__ = window.__nocobase_app_dev_deps__ || {};
    window.__nocobase_app_dev_deps__[name] = value;
  }
}

/**
 * @internal
 */
export function defineGlobalDeps(requirejs: RequireJS) {
  // react
  defineGlobalDep(requirejs, 'react', React);
  defineGlobalDep(requirejs, 'react-dom', ReactDOM);
  defineGlobalDep(requirejs, 'react/jsx-runtime', jsxRuntime);
  defineGlobalDep(requirejs, 'react/jsx-dev-runtime', jsxDevRuntime);

  // react-router
  defineGlobalDep(requirejs, 'react-router', ReactRouter);
  defineGlobalDep(requirejs, 'react-router-dom', ReactRouterDom);

  // antd
  defineGlobalDep(requirejs, 'antd', antd);
  defineGlobalDep(requirejs, '@ant-design/icons', antdIcons);
  defineGlobalDep(requirejs, '@ant-design/cssinjs', antdCssinjs);
  defineGlobalDep(requirejs, 'antd-style', antdStyle);

  // i18next
  defineGlobalDep(requirejs, 'i18next', i18next);
  defineGlobalDep(requirejs, 'react-i18next', reactI18next);

  // formily
  defineGlobalDep(requirejs, '@formily/antd-v5', formilyAntdV5);
  defineGlobalDep(requirejs, '@formily/core', formilyCore);
  defineGlobalDep(requirejs, '@formily/react', formilyReact);
  defineGlobalDep(requirejs, '@formily/reactive', formilyReactive);
  defineGlobalDep(requirejs, '@formily/shared', formilyShared);

  // nocobase
  defineGlobalDep(requirejs, '@nocobase/utils', nocobaseClientUtils);
  defineGlobalDep(requirejs, '@nocobase/utils/client', nocobaseClientUtils);
  defineGlobalDep(requirejs, '@nocobase/client-v2', nocobaseClientV2);
  defineGlobalDep(requirejs, '@nocobase/client-v2/client-v2', nocobaseClientV2);
  defineGlobalDep(requirejs, '@nocobase/flow-engine', nocobaseFlowEngine);
  defineGlobalDep(requirejs, '@nocobase/evaluators', nocobaseEvaluators);
  defineGlobalDep(requirejs, '@nocobase/evaluators/client', nocobaseEvaluators);

  defineGlobalDep(requirejs, '@dnd-kit/core', dndKitCore);
  defineGlobalDep(requirejs, '@dnd-kit/sortable', dndKitSortable);

  // utils
  defineGlobalDep(requirejs, '@ctrl/tinycolor', ctrlTinycolor);
  defineGlobalDep(requirejs, 'ahooks', ahooks);
  defineGlobalDep(requirejs, 'axios', axios);
  defineGlobalDep(requirejs, 'dayjs', dayjs);
  defineGlobalDep(requirejs, 'lodash', lodash);
  defineGlobalDep(requirejs, '@emotion/css', emotionCss);
  defineGlobalDep(requirejs, 'file-saver', FileSaver);
}
