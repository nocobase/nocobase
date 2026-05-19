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
import * as nocobaseClientV2 from '../index';
import * as dndKitCore from '@dnd-kit/core';
import * as dndKitSortable from '@dnd-kit/sortable';
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
  requirejs.define('antd-style', () => antdStyle);

  // i18next
  requirejs.define('i18next', () => i18next);
  requirejs.define('react-i18next', () => reactI18next);

  // formily
  requirejs.define('@formily/antd-v5', () => formilyAntdV5);
  requirejs.define('@formily/core', () => formilyCore);
  requirejs.define('@formily/react', () => formilyReact);
  requirejs.define('@formily/reactive', () => formilyReactive);
  requirejs.define('@formily/shared', () => formilyShared);

  // nocobase
  requirejs.define('@nocobase/utils', () => nocobaseClientUtils);
  requirejs.define('@nocobase/utils/client', () => nocobaseClientUtils);
  requirejs.define('@nocobase/client-v2', () => nocobaseClientV2);
  requirejs.define('@nocobase/client-v2/client-v2', () => nocobaseClientV2);
  requirejs.define('@nocobase/flow-engine', () => nocobaseFlowEngine);
  requirejs.define('@nocobase/evaluators', () => nocobaseEvaluators);
  requirejs.define('@nocobase/evaluators/client', () => nocobaseEvaluators);

  requirejs.define('@dnd-kit/core', () => dndKitCore);
  requirejs.define('@dnd-kit/sortable', () => dndKitSortable);

  // utils
  requirejs.define('ahooks', () => ahooks);
  requirejs.define('axios', () => axios);
  requirejs.define('dayjs', () => dayjs);
  requirejs.define('lodash', () => lodash);
  requirejs.define('@emotion/css', () => emotionCss);
  requirejs.define('file-saver', () => FileSaver);
}
