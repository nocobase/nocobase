/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import {
  ActionContextProvider,
  ResourceActionProvider,
  SchemaComponent,
  useActionContext,
  useRecord,
  AssociationField,
} from '@nocobase/client';
import React, { useEffect, useRef, useState } from 'react';
import { Select } from 'antd';
import { Field } from '@formily/core';
import { connect, mapReadPretty, useField } from '@formily/react';
import { departmentOwnersSchema } from './schemas/departments';

// Edit mode
export const EditableDepartmentOwnersField: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const department = useRecord() as any;
  const field = useField<Field>();
  const [value, setValue] = useState([]);
  const selectedRows = useRef([]);
  const handleSelect = (_: number[], rows: any[]) => {
    selectedRows.current = rows;
  };

  const useSelectOwners = () => {
    const { setVisible } = useActionContext();
    return {
      run() {
        const selected = field.value || [];
        field.setValue([...selected, ...selectedRows.current]);
        selectedRows.current = [];
        setVisible(false);
      },
    };
  };

  useEffect(() => {
    if (!field.value) {
      return;
    }
    setValue(
      field.value.map((owner: any) => ({
        value: owner.id,
        label: owner.nickname || owner.username,
      })),
    );
  }, [field.value]);

  const RequestProvider: React.FC = (props) => (
    <ResourceActionProvider
      collection="users"
      request={{
        resource: `departments/${department.id}/members`,
        action: 'list',
        params: {
          filter: field.value?.length
            ? {
                id: {
                  $notIn: field.value.map((owner: any) => owner.id),
                },
              }
            : {},
        },
      }}
    >
      {props.children}
    </ResourceActionProvider>
  );

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Select
        open={false}
        onChange={(value) => {
          if (!value) {
            field.setValue([]);
            return;
          }
          field.setValue(
            value.map(({ label, value }: { label: string; value: string }) => ({
              id: value,
              nickname: label,
            })),
          );
        }}
        mode="multiple"
        value={value}
        labelInValue={true}
        onDropdownVisibleChange={(open) => setVisible(open)}
      />
      <SchemaComponent
        schema={departmentOwnersSchema}
        components={{ RequestProvider }}
        scope={{ department, handleSelect, useSelectOwners }}
      />
    </ActionContextProvider>
  );
};

// Auto switch between edit and readonly mode
export const DepartmentOwnersField = connect(EditableDepartmentOwnersField, mapReadPretty(AssociationField.ReadPretty));
