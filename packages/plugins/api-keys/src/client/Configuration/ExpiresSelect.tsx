import { css } from '@emotion/css';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { useCompile, useRecord } from '@nocobase/client';
import { useBoolean } from 'ahooks';
import { DatePicker, Select, Space, Typography } from 'antd';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useTranslation } from '../locale';

const InternalExpiresSelect = (props) => {
  const { onChange } = props;
  const [isCustom, { toggle: toggleShowDatePicker, setFalse }] = useBoolean();
  const compile = useCompile();

  const options = useMemo(() => {
    return compile(props.options);
  }, [props.options]);

  const onSelectChange = (v) => {
    if (v === 'custom') {
      onChange(undefined);
      return toggleShowDatePicker();
    } else {
      setFalse();
      onChange(v);
    }
  };

  const onDatePickerChange = (v: moment.Moment) => {
    v = v.milliseconds(0).seconds(0);
    const now = moment().milliseconds(0).seconds(0);
    onChange(v === null ? undefined : v.diff(now, 'd') + 'd');
  };

  return (
    <Space
      align="center"
      className={css`
        width: 100%;
        & > .ant-space-item {
          flex: 1;
        }
      `}
    >
      <Select {...props} value={isCustom ? 'custom' : props.value} options={options} onChange={onSelectChange}></Select>
      {isCustom ? (
        <DatePicker
          disabledDate={(time) => {
            return time.isSameOrBefore();
          }}
          onChange={onDatePickerChange}
          showToday={false}
        />
      ) : null}
    </Space>
  );
};

const ReadPretty = () => {
  const record = useRecord();
  const { t } = useTranslation();
  const expiresDate = useMemo(() => {
    if (record?.expiresIn === 'never') return t('Never expires');
    return moment(record?.createdAt)
      .add(record?.expiresIn?.replace('d', '') || 0, 'days')
      .format('YYYY-MM-DD HH:mm:ss');
  }, [record?.createdAt, record?.expiresIn]);

  return <Typography.Text>{expiresDate}</Typography.Text>;
};

const ExpiresSelect = connect(
  InternalExpiresSelect,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty(ReadPretty),
);

export { ExpiresSelect };
