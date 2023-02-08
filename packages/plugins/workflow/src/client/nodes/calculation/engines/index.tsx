import React from 'react';
import { css } from '@emotion/css';

import { Registry } from '@nocobase/utils/client';
import { i18n } from '@nocobase/client';

import mathjs from './mathjs';
import formulajs from './formulajs';

export interface CalculationEngine {
  label: string;
  tooltip?: string;
  link?: string;
  evaluate(exp: string): any;
}

export const calculationEngines = new Registry<CalculationEngine>();

calculationEngines.register('math.js', mathjs);
calculationEngines.register('formula.js', formulajs);

export const renderReference = (key: string) => {
  const engine = calculationEngines.get(key);
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
