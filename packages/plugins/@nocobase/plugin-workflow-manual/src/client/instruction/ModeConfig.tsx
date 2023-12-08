import { QuestionCircleOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { Form, Radio, Tooltip } from 'antd';
import React from 'react';

import { css, FormItem } from '@nocobase/client';
import { useLang } from '../../locale';

function parseMode(v) {
  if (!v) {
    return 'single';
  }
  if (v >= 1) {
    return 'all';
  }
  if (v <= -1) {
    return 'any';
  }

  const dir = Math.sign(v);
  if (dir > 0) {
    return '';
  }
}

export function ModeConfig({ value, onChange }) {
  const mode = parseMode(value);
  const negotiationFieldset = (
    <fieldset>
      <FormLayout layout="vertical">
        <FormItem label={useLang('Negotiation')}>
          <Radio.Group value={value} onChange={onChange}>
            <Radio value={1}>
              <Tooltip title={useLang('Everyone should pass')} placement="bottom">
                <span>{useLang('All pass')}</span>
                <QuestionCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Radio>
            <Radio value={-1}>
              <Tooltip title={useLang('Anyone pass')} placement="bottom">
                <span>{useLang('Any pass')}</span>
                <QuestionCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Radio>
          </Radio.Group>
        </FormItem>
      </FormLayout>
    </fieldset>
  );
  return (
    <fieldset
      className={css`
        .ant-radio-group {
          .anticon {
            margin-left: 0.5em;
          }
        }
      `}
    >
      <Form.Item>
        <Radio.Group
          value={Boolean(value)}
          onChange={({ target: { value: v } }) => {
            console.log(v);
            onChange(Number(v));
          }}
        >
          <Radio value={true}>
            <Tooltip title={useLang('Each user has own task')} placement="bottom">
              <span>{useLang('Separately')}</span>
              <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Radio>
          <Radio value={false}>
            <Tooltip title={useLang('Everyone shares one task')} placement="bottom">
              <span>{useLang('Collaboratively')}</span>
              <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Radio>
        </Radio.Group>
      </Form.Item>
      {value ? negotiationFieldset : null}
    </fieldset>
  );
}
