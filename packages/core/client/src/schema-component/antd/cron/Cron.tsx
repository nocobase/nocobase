import { css } from '@emotion/css';
import { connect, mapReadPretty } from '@formily/react';
import cronstrue from 'cronstrue';
import React from 'react';
import { Cron as ReactCron, CronProps } from 'react-js-cron';
import { useAPIClient } from '../../../api-client';

type ComposedCron = React.FC<CronProps> & {};

const Input = (props: Exclude<CronProps, 'setValue'> & { onChange: (value: string) => void }) => {
  const { onChange, ...rest } = props;
  return (
    <fieldset
      className={css`
        .react-js-cron {
          padding: 0.5em 0.5em 0 0.5em;
          border: 1px dashed #ccc;
          .react-js-cron-field {
            flex-shrink: 0;
            margin-bottom: 0.5em;

            > span {
              flex-shrink: 0;
              margin: 0 0.5em 0 0;
            }

            > .react-js-cron-select {
              margin: 0 0.5em 0 0;
            }
          }
        }
      `}
    >
      <ReactCron setValue={onChange} locale={window['cronLocale']} {...rest} />
    </fieldset>
  );
};

export const ReadPretty = (props) => {
  const api = useAPIClient();
  const locale = api.auth.getLocale();
  return props.value ? (
    <span>
      {cronstrue.toString(props.value, {
        locale,
        use24HourTimeFormat: true,
      })}
    </span>
  ) : null;
};

export const Cron: ComposedCron = connect(Input, mapReadPretty(ReadPretty));

export default Cron;
