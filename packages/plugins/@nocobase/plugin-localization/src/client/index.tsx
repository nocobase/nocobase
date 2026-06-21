/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { lazy } from '@nocobase/client';
import { Typography } from 'antd';
import React from 'react';
const Localization = lazy(() => import('../client-v2/pages/LocalizationPage'));
import { NAMESPACE } from './locale';
import { MissingKeyHandler } from './i18n-missing-handler';

type AsyncTaskManagerClientPlugin = {
  taskOrigins: {
    register: (
      name: string,
      value: {
        Result?: React.ComponentType<any>;
        ResultButton?: React.ComponentType<any>;
        namespace?: string;
      },
    ) => void;
  };
};

const LocalizationAITranslateResult = ({ payload }) => {
  return (
    <Typography.Text>
      {payload?.translated ?? 0} / {payload?.total ?? 0}
    </Typography.Text>
  );
};

export class PluginLocalizationClient extends Plugin {
  async load() {
    const missingKeyHandler = new MissingKeyHandler(this.engine.context);
    missingKeyHandler.register();

    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Localization", { ns: "${NAMESPACE}" })}}`,
      icon: 'GlobalOutlined',
      Component: Localization,
      aclSnippet: 'pm.localization.localization',
    });

    (this.app.pm.get('async-task-manager') as AsyncTaskManagerClientPlugin | undefined)?.taskOrigins.register(
      'localization',
      {
        Result: LocalizationAITranslateResult,
        namespace: NAMESPACE,
      },
    );
  }
}

export default PluginLocalizationClient;
