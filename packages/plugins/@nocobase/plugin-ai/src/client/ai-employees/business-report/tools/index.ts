/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToolsOptions, lazy } from '@nocobase/client';
import { tval } from '@nocobase/utils/client';

const { BusinessReportCard } = lazy(() => import('../ui/BusinessReportCard'), 'BusinessReportCard');
const { BusinessReportModal } = lazy(() => import('../ui/BusinessReportModal'), 'BusinessReportModal');
const { BusinessReportModalFooter } = lazy(() => import('../ui/BusinessReportModal'), 'BusinessReportModalFooter');

export const businessReportGeneratorTool: [string, ToolsOptions] = [
  'businessReportGenerator',
  {
    ui: {
      card: BusinessReportCard,
      modal: {
        title: tval('Business analysis report', { ns: 'ai' }),
        hideOkButton: true,
        props: {
          width: '92%',
          styles: {
            body: {
              height: 'calc(100vh - 240px)',
              maxHeight: 'calc(100vh - 240px)',
              overflow: 'hidden',
              paddingTop: 16,
              paddingBottom: 0,
            },
          },
        },
        footer: BusinessReportModalFooter,
        Component: BusinessReportModal,
      },
    },
  },
];
