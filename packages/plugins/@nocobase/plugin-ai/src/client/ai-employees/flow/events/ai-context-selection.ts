/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionBlockModel } from '@nocobase/client';
import { useAISelectionStore } from '../../ai-selection';
import classNames from 'classnames';

CollectionBlockModel.registerFlow({
  key: 'aiOnSelectSettings',
  steps: {
    aiOnSelect: {
      handler(ctx, params) {
        ctx.model.setDecoratorProps({
          className: classNames('ai-selectable', ctx.model.decoratorProps.className),
          onClick: () => {
            const aiSelection = useAISelectionStore.getState();
            if (!aiSelection.selectable) {
              return;
            }
            aiSelection.selector?.onSelect({ uid: ctx.model.uid });
            aiSelection.stopSelect();
          },
        });
      },
    },
  },
});
