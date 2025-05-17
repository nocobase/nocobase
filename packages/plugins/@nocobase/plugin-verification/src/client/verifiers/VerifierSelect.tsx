/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { connect, mapReadPretty, useField, Schema } from '@formily/react';
import { Select, Tag } from 'antd';
import { ArrayField } from '@formily/core';
import { EllipsisWithTooltip, useAPIClient, useRequest } from '@nocobase/client';
import { useVerificationTranslation } from '../locale';
import { Link } from 'react-router-dom';
import { FormItem } from '@formily/antd-v5';

const ReadPretty: React.FC = () => {
  const field = useField<ArrayField>();
  return field.value?.length ? (
    <EllipsisWithTooltip ellipsis={true}>
      {field.value.map((item) => (
        <Tag key={item.name}>{item.title}</Tag>
      ))}
    </EllipsisWithTooltip>
  ) : null;
};

export const VerifierSelect = connect((props) => {
  const { t } = useVerificationTranslation();
  const { scene, value, title, onChange } = props;
  let { multiple } = props;
  multiple = multiple ? 'multiple' : undefined;
  const api = useAPIClient();
  const { data } = useRequest(() =>
    api
      .resource('verifiers')
      .listByScene({
        scene,
      })
      .then((res) => res?.data?.data),
  );
  const { verifiers = [], availableTypes = [] } = (data as any) || {};
  const options = useMemo(
    () => verifiers?.map((item: { title: string; name: string }) => ({ label: item.title, value: item.name })),
    [verifiers],
  );
  return (
    <FormItem
      label={title || t('Verifiers')}
      extra={
        <>
          {t('The following types of verifiers are available:')}
          {availableTypes.map((item: { title: string }) => Schema.compile(item.title, { t })).join(', ')}
          {'. '}
          {t('Go to')} <Link to="/admin/settings/verification">{t('create verifiers')}</Link>
        </>
      }
    >
      <Select allowClear options={options} value={value} mode={multiple} onChange={onChange} />
    </FormItem>
  );
}, mapReadPretty(ReadPretty));
