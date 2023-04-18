import React from "react";
import { css } from '@emotion/css';

import { i18n } from "@nocobase/client";
import evaluators from "@nocobase/evaluators/client";



export const renderEngineReference = (key: string) => {
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
