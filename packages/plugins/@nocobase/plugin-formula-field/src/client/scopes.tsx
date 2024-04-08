import { css, i18n } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import React from 'react';
import { NAMESPACE } from './locale';

export function renderExpressionDescription(key: string) {
  const engine = (evaluators as Registry<Evaluator>).get(key);

  return engine?.link ? (
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
        {i18n.t('Syntax references', { ns: NAMESPACE })}
      </span>
      <a href={engine.link} target="_blank" rel="noreferrer">
        {engine.label}
      </a>
    </>
  ) : null;
}
