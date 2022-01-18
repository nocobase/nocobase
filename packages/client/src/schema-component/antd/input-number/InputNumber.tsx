import React from 'react';
import { connect, mapReadPretty } from '@formily/react';
import { InputNumber as AntdNumber } from 'antd';
import { ReadPretty } from './ReadPretty';

export const InputNumber = connect(AntdNumber, mapReadPretty(ReadPretty));

export default InputNumber;
