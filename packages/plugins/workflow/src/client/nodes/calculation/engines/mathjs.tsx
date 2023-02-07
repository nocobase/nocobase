import React from "react";
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { evaluate } from "mathjs";
import { i18n } from "@nocobase/client";
import { lang } from "../../../locale";

export default {
  label: (
    <>
      <span>Math.js</span>
      <Tooltip
        title={i18n.t('Math.js comes with a large set of built-in functions and constants, and offers an integrated solution to work with different data types')}
        placement="bottom"
      >
        <QuestionCircleOutlined style={{ color: '#999' }} />
      </Tooltip>
    </>
  ),
  description: (
    <>
      {lang('Syntax references')}
      <a href="https://mathjs.org/" target="_blank">math.js</a>
    </>
  ),
  evaluate
};
