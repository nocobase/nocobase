/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { connect, mapReadPretty } from '@formily/react';
import { error } from '@nocobase/utils/client';
import cronstrue from 'cronstrue';
import React, { useMemo } from 'react';
import { CronProps as ReactJsCronProps, Cron as ReactCron } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import { useAPIClient } from '../../../api-client';

export interface CronProps extends Omit<ReactJsCronProps, 'setValue'> {
  onChange: (value: string) => void;
}

const Input = (props: CronProps) => {
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
              .ant-select-selection-overflow {
                align-items: center;
                flex: initial;
              }
            }
          }
        }
      `}
    >
      <ReactCron setValue={onChange} locale={window['cronLocale']} {...rest} />
    </fieldset>
  );
};

interface CronReadPrettyProps {
  value?: string;
}

const ReadPretty = (props: CronReadPrettyProps) => {
  const api = useAPIClient();
  const locale = api.auth.getLocale();
  const value = useMemo(() => {
    try {
      return cronstrue.toString(props.value, {
        locale,
        use24HourTimeFormat: true,
      });
    } catch {
      error(`The '${props.value}' is not a valid cron expression`);
      return props.value;
    }
  }, [props.value]);
  return props.value ? <span>{value}</span> : null;
};

export const Cron = connect(Input, mapReadPretty(ReadPretty)) as unknown as typeof Input & {
  ReadPretty;
};

Cron.ReadPretty = ReadPretty;

export default Cron;
