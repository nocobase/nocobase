/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import React, { lazy } from 'react';
import { API_DOC_ACL, DOCUMENTATION_PATH } from '../client-v2/constants';
import DocumentationPreviewShell from '../client-v2/pages/DocumentationPreviewShell';
import { NAMESPACE, useTranslation } from '../locale';

const Documentation = lazy(() => import('./Documentation'));

const SCDocumentation = () => {
  const { t } = useTranslation();

  return (
    <DocumentationPreviewShell previewTitle={t('Preview')}>
      <Documentation />
    </DocumentationPreviewShell>
  );
};

export class PluginAPIDocClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("API documentation", { ns: "${NAMESPACE}" })}}`,
      icon: 'BookOutlined',
      Component: SCDocumentation,
      aclSnippet: API_DOC_ACL,
    });

    this.app.router.add('api-documentation', {
      path: DOCUMENTATION_PATH,
      Component: Documentation,
    });
  }
}

export default PluginAPIDocClient;
