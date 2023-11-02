import { CollectionManagerContext, css, i18n, registerField, SchemaComponentOptions } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import React, { useContext } from 'react';
import { Formula } from './components';
import formulaField from './interfaces/formula';
import { NAMESPACE } from './locale';

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

export const FormulaFieldProvider = React.memo((props) => {
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
FormulaFieldProvider.displayName = 'FormulaFieldProvider';
