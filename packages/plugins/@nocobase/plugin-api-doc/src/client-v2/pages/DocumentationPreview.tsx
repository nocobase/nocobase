/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { DOCUMENTATION_PATH } from '../constants';
import { useT } from '../locale';
import Documentation from './Documentation';
import DocumentationPreviewShell from './DocumentationPreviewShell';

const DocumentationPreview = () => {
  const ctx = useFlowContext();
  const t = useT();
  const documentationHref = ctx.app.getRouteUrl(DOCUMENTATION_PATH);

  return (
    <DocumentationPreviewShell href={documentationHref} previewTitle={t('Preview')}>
      <Documentation />
    </DocumentationPreviewShell>
  );
};

export default DocumentationPreview;
