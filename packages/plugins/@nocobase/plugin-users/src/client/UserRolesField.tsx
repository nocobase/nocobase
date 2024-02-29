import React from 'react';
import { useField, Schema } from '@formily/react';
import { Field } from '@formily/core';
import { useUsersTranslation } from './locale';
import { Tag } from 'antd';

export const UserRolesField: React.FC = () => {
  const { t } = useUsersTranslation();
  const field = useField<Field>();
  return (field.value || []).map((role: { name: string; title: string }) => (
    <Tag key={role.name}>{Schema.compile(role.title, { t })}</Tag>
  ));
};
