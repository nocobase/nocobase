/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v2-native copy of the v1 `renderEngineReference` (mirrors `client/components/
 * renderEngineReference.tsx`). Renders the "Syntax references: <engine link>"
 * hint shown under the condition node's expression field.
 *
 * Unlike v1 (which read the module-level `i18n.t` from `@nocobase/client`), the
 * translate function is **injected** so this stays Formily-free and pure —
 * callers pass the v2 `useT()` result. `css` comes from `@emotion/css`.
 */

import { css } from '@emotion/css';
import { evaluators } from '@nocobase/evaluators/client';
import React from 'react';

export const renderEngineReference = (key: string, t: (text: string) => string) => {
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
        {t('Syntax references')}
      </span>
      <a href={t(engine.link)} target="_blank" rel="noreferrer">
        {engine.label}
      </a>
    </>
  ) : null;
};
