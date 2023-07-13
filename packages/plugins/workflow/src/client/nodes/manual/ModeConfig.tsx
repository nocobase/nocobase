import { QuestionCircleOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { Form, Radio, Tooltip } from 'antd';
import React from 'react';

import { css, FormItem } from '@nocobase/client';
import { lang } from '../../locale';

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
            <Tooltip title={lang('Each user has own task')} placement="bottom">
              <span>{lang('Separately')}</span>
              <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Radio>
          <Radio value={false}>
            <Tooltip title={lang('Everyone shares one task')} placement="bottom">
              <span>{lang('Collaboratively')}</span>
              <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Radio>
        </Radio.Group>
      </Form.Item>
      {value ? (
        <fieldset>
          <FormLayout layout="vertical">
            <FormItem label={lang('Negotiation')}>
              <Radio.Group value={value} onChange={onChange}>
                <Radio value={1}>
                  <Tooltip title={lang('Everyone should pass')} placement="bottom">
                    <span>{lang('All pass')}</span>
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Radio>
                <Radio value={-1}>
                  <Tooltip title={lang('Anyone pass')} placement="bottom">
                    <span>{lang('Any pass')}</span>
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Radio>
              </Radio.Group>
            </FormItem>
          </FormLayout>
        </fieldset>
      ) : null}
    </fieldset>
  );
}
