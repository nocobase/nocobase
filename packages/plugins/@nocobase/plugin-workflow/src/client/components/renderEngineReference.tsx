/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, i18n } from '@nocobase/client';
import { evaluators } from '@nocobase/evaluators/client';
import React from 'react';

export const renderEngineReference = (key: string) => {
  const engine = evaluators.get(key);
  if (!engine) {
    return null;
  }

  return engine.link ? (
    <>
      <span
        className={css`
          &:after {
            content: ':';
          }
          & + a {
            margin-left: 0.25em;
          }
        `}
      >
        {i18n.t('Syntax references')}
      </span>
      <a href={i18n.t(engine.link)} target="_blank" rel="noreferrer">
        {engine.label}
      </a>
    </>
  ) : null;
};
