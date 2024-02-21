import { css, i18n, SchemaComponentOptions } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import React from 'react';
import { Formula } from './components';
import { NAMESPACE } from './locale';

function renderExpressionDescription(key: string) {
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

export const FormulaFieldProvider = React.memo((props) => {
  return (
    <SchemaComponentOptions
      components={{
        Formula,
        // DynamicExpression
      }}
      scope={{
        renderExpressionDescription,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
});
FormulaFieldProvider.displayName = 'FormulaFieldProvider';
