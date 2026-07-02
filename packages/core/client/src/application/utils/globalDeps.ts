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
import * as dndKitCore from '@dnd-kit/core';
import * as dndKitSortable from '@dnd-kit/sortable';
import * as emotionCss from '@emotion/css';
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
import * as nocobaseSDK from '@nocobase/sdk';
import * as nocobaseClientUtils from '@nocobase/utils/client';
import { dayjs } from '@nocobase/utils/client';
import * as nocobaseFlowEngine from '@nocobase/flow-engine';
import * as ahooks from 'ahooks';
import * as antd from 'antd';
import * as antdStyle from 'antd-style';
import axios from 'axios';
import * as FileSaver from 'file-saver';
import * as i18next from 'i18next';
import lodash from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import * as reactI18next from 'react-i18next';
import * as ReactRouter from 'react-router';
import * as ReactRouterDom from 'react-router-dom';
import jsxRuntime from 'react/jsx-runtime';
import jsxDevRuntime from 'react/jsx-dev-runtime';
import * as nocobaseClient from '../../index';

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
  defineGlobalDep(requirejs, 'antd-style', antdStyle);
  defineGlobalDep(requirejs, '@ant-design/icons', antdIcons);
  defineGlobalDep(requirejs, '@ant-design/cssinjs', antdCssinjs);

  // i18next
  defineGlobalDep(requirejs, 'i18next', i18next);
  defineGlobalDep(requirejs, 'react-i18next', reactI18next);

  // formily
  defineGlobalDep(requirejs, '@formily/antd-v5', formilyAntdV5);
  defineGlobalDep(requirejs, '@formily/core', formilyCore);
  defineGlobalDep(requirejs, '@formily/react', formilyReact);
  defineGlobalDep(requirejs, '@formily/shared', formilyShared);
  defineGlobalDep(requirejs, '@formily/json-schema', formilyJsonSchema);
  defineGlobalDep(requirejs, '@formily/reactive', formilyJsonReactive);
  defineGlobalDep(requirejs, '@formily/path', formilyPath);
  defineGlobalDep(requirejs, '@formily/validator', formilyValidator);
  defineGlobalDep(requirejs, '@formily/reactive-react', formilyReactiveReact);

  // nocobase
  defineGlobalDep(requirejs, '@nocobase/utils', nocobaseClientUtils);
  defineGlobalDep(requirejs, '@nocobase/utils/client', nocobaseClientUtils);
  defineGlobalDep(requirejs, '@nocobase/client', nocobaseClient);
  defineGlobalDep(requirejs, '@nocobase/client/client', nocobaseClient);
  defineGlobalDep(requirejs, '@nocobase/evaluators', nocobaseEvaluators);
  defineGlobalDep(requirejs, '@nocobase/evaluators/client', nocobaseEvaluators);
  defineGlobalDep(requirejs, '@nocobase/sdk', nocobaseSDK);
  defineGlobalDep(requirejs, '@nocobase/flow-engine', nocobaseFlowEngine);

  defineGlobalDep(requirejs, '@dnd-kit/core', dndKitCore);
  defineGlobalDep(requirejs, '@dnd-kit/sortable', dndKitSortable);

  // utils
  defineGlobalDep(requirejs, 'axios', axios);
  defineGlobalDep(requirejs, 'dayjs', dayjs);
  defineGlobalDep(requirejs, 'lodash', lodash);
  defineGlobalDep(requirejs, 'ahooks', ahooks);
  defineGlobalDep(requirejs, '@emotion/css', emotionCss);
  defineGlobalDep(requirejs, 'file-saver', FileSaver);
}
