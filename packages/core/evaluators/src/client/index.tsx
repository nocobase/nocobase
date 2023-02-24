import React from 'react';
import { css } from '@emotion/css';

import { i18n } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';

import mathjs from './engines/mathjs';
import formulajs from './engines/formulajs';

export interface Evaluator {
  label: string;
  tooltip?: string;
  link?: string;
  evaluate(exp: string, scope?: { [key: string]: any }): any;
}

export const evaluators = new Registry<Evaluator>();

evaluators.register('math.js', mathjs);
evaluators.register('formula.js', formulajs);

export const renderReference = (key: string) => {
  const engine = evaluators.get(key);
  if (!engine) {
    return null;
  }

  return engine.link
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
          {i18n.t('Syntax references')}
        </span>
        <a href={engine.link} target="_blank">{engine.label}</a>
      </>
    )
    : null
};

export default evaluators;
