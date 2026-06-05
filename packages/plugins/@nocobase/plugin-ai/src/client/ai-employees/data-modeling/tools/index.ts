/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import { useChatToolsStore } from '../../chatbox/stores/chat-tools';
import { useAISelectionContext } from '../../1.x/selector/AISelectorProvider';
import { lazy, useDataSource, ToolsOptions } from '@nocobase/client';

const { DataModelingCard } = lazy(() => import('../ui/DataModelingCard'), 'DataModelingCard');
const { DataModelingModal } = lazy(() => import('../ui/DataModelingModal'), 'DataModelingModal');

export const defineCollectionsTool: [string, ToolsOptions] = [
  'defineCollections',
  {
    ui: {
      card: DataModelingCard,
      modal: {
        title: tval('Data modeling', { ns: 'ai' }),
        okText: tval('Finish review and apply', { ns: 'ai' }),
        useOnOk: (decisions, adjustArgs) => {
          const ds = useDataSource();
          const { ctx } = useAISelectionContext();
          const refresh = ctx['collections:list']?.service?.refresh;
          return {
            onOk: async () => {
              await decisions.edit(adjustArgs);
              await ds?.reload();
              await refresh?.();
            },
          };
        },
        Component: DataModelingModal,
      },
    },
  },
];
