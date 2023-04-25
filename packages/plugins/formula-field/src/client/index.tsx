import React, { useContext } from 'react';
import { i18n } from '@nocobase/client';
import { css } from '@emotion/css';

import { CollectionManagerContext, registerField, SchemaComponentOptions } from '@nocobase/client';
import { evaluators, Evaluator } from '@nocobase/evaluators/client';

import { Formula } from './components';
import formulaField from './interfaces/formula';
import { NAMESPACE } from './locale';
import { Registry } from '@nocobase/utils/client';

registerField(formulaField.group, 'formula', formulaField);

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

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
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
      <CollectionManagerContext.Provider
        value={{
          ...ctx,
          interfaces: {
            ...ctx.interfaces,
            formula: formulaField,
            // expression: expressionField
          },
        }}
      >
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});
