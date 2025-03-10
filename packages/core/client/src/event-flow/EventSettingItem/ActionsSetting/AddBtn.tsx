/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { useField, useForm } from '@formily/react';
import { ArrayField, VoidField } from '@formily/core';
import { CloseCircleOutlined } from '@ant-design/icons';

export const AddBtn = observer((props: { addKey: string; text: string }) => {
  const form = useForm();
  const field = useField<VoidField>();
  const onClick = () => {
    const actionsField = form.query(field.path.parent() + props.addKey).take() as ArrayField;
    if (actionsField) {
      actionsField.push({});
    }
  };
  return (
    <Button type="link" onClick={onClick}>
      {props.text}
    </Button>
  );
});

export const DeleteBtn = observer((props: { addKey: string; text: string }) => {
  const form = useForm();
  const field = useField<ArrayField>();
  const onClick = () => {
    const actionsField = form.query(field.path.parent().parent()).take() as ArrayField;
    const currentIndex = form.query(field.path.parent()).take().index;
    actionsField.remove(currentIndex);
  };
  return <Button type="text" icon={<CloseCircleOutlined />} onClick={onClick} />;
});
