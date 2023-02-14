import React, { useContext } from 'react';
import { i18n } from '@nocobase/client';
import { css } from '@emotion/css';

import { CollectionManagerContext, registerField, SchemaComponentOptions } from '@nocobase/client';
import evaluators from '@nocobase/evaluators/client';

import { formula } from './formula';
import { NAMESPACE } from './locale';



registerField(formula.group, 'formula', formula);

function renderExpressionDescription(key: string) {
  const engine = evaluators.get(key);

  return engine?.link
    ? (
      <>
        <span className={css`
          &:after {
            content: ':';
          }
          & + a {
            margin-left: .25em;
          }
        `}>
          {i18n.t('Syntax references', { ns: NAMESPACE })}
        </span>
        <a href={engine.link} target="_blank">{engine.label}</a>
      </>
    )
    : null
}

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions
      scope={{
        renderExpressionDescription
      }}
    >
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, formula } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});
