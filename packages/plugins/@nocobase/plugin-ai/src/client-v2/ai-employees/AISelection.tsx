/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@nocobase/flow-engine';
import { Global, css } from '@emotion/react';
import { aiSelection } from './stores/ai-selection';

export const AISelection: React.FC = observer(() => {
  const selectable = aiSelection.selectable;

  if (!selectable) {
    return null;
  }

  return (
    <Global
      styles={css`
        .ai-selectable {
          position: relative;
          transition: all 0.3s ease;
        }

        .ai-selectable:hover {
          cursor: grab;
        }

        .ai-selectable::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 210, 255, 0.2);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 100;
        }

        .ai-selectable:hover::after {
          opacity: 1;
        }
      `}
    />
  );
});

AISelection.displayName = 'AISelection';
