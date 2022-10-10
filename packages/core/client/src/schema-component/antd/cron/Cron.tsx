import React from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Cron as ReactCron, CronProps } from 'react-js-cron';
import cronstrue from 'cronstrue';
import 'cronstrue/locales/zh_CN';
import { css } from '@emotion/css';

import localeZhCN from './locale/zh-CN';

const ComponentLocales = {
  'zh-CN': localeZhCN,
};

const ReadPrettyLocales = {
  'en-US': 'en',
  'zh-CN': 'zh_CN'
};

type ComposedCron = React.FC<CronProps> & {}

export const Cron: ComposedCron = connect(
  (props: Exclude<CronProps, 'setValue'> & { onChange: (value: string) => void }) => {
    const { onChange, ...rest } = props;
    const locale = ComponentLocales[localStorage.getItem('NOCOBASE_LOCALE') || 'en-US'];
    return (
      <fieldset className={css`
        .react-js-cron{
          padding: .5em .5em 0 .5em;
          border: 1px dashed #ccc;

          .react-js-cron-field{
            flex-shrink: 0;
            margin-bottom: .5em;

            > span{
              flex-shrink: 0;
              margin: 0 .5em 0 0;
            }

            > .react-js-cron-select{
              margin: 0 .5em 0 0;
            }
          }
      `}>
        <ReactCron
          setValue={onChange}
          locale={locale}
          {...rest}
        />
      </fieldset>
    );
  },
  mapReadPretty((props) => {
    const locale = ReadPrettyLocales[localStorage.getItem('NOCOBASE_LOCALE') || 'en-US'];
    return props.value
      ? (
        <span>
          {cronstrue.toString(props.value, {
            locale,
            use24HourTimeFormat: true
          })}
        </span>
      )
      : null;
  })
);

export default Cron;
