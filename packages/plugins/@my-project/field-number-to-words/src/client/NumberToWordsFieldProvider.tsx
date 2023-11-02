import { CollectionManagerContext, css, i18n, registerField, SchemaComponentOptions } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import React, { useContext } from 'react';
import { NumberToWords } from './components';
import NumberToWordsField from './interfaces/NumberToWords';
import { NAMESPACE } from './locale';

registerField(NumberToWordsField.group, 'NumberToWords', NumberToWordsField);

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

export const NumberToWordsFieldProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions
      components={{
        NumberToWords,
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
            NumberToWords: NumberToWordsField,
            // expression: expressionField
          },
        }}
      >
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});
NumberToWordsFieldProvider.displayName = 'NumberToWordsFieldProvider';
