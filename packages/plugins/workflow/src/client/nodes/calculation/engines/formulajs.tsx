import React from "react";
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import * as formulajs from '@formulajs/formulajs';
import { i18n } from "@nocobase/client";
import { lang } from '../../../locale';

export default {
  label: (
    <>
      <span>Formula.js</span>
      <Tooltip
        title={i18n.t('Formula.js supports most Microsoft Excel formula functions.')}
        placement="bottom"
      >
        <QuestionCircleOutlined style={{ color: '#999' }} />
      </Tooltip>
    </>
  ),
  description: (
    <>
      {lang('Syntax references')}
      <a href="https://formulajs.info/functions/" target="_blank">Formula.js</a>
    </>
  ),
  evaluate(exp: string) {
    const fn = new Function(...Object.keys(formulajs), `return ${exp}`);
    return fn(...Object.values(formulajs));
  }
};
