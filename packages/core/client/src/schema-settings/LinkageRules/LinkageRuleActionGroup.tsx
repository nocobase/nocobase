
import { observer } from '@formily/react';
import { ArrayField, useField, ObjectField } from '@formily/react';
import { ArrayField as ArrayFieldModel } from '@formily/core';

import { Space } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RemoveActionContext } from './context';

import { LinkageRuleAction } from './LinkageRuleAction';
export const LinkageRuleActions = observer((props: any): any => {
  const field = useField<ArrayFieldModel>();
  return field?.value?.map((item, index) => {
    return (
      <RemoveActionContext.Provider key={index} value={() => field.remove(index)}>
        <ObjectField name={index} component={[LinkageRuleAction]} />
      </RemoveActionContext.Provider>
    );
  });
});

export const LinkageRuleActionGroup = (props) => {
  const { t } = useTranslation();
  const field = useField<any>();
  const logic = 'action';
  return (
    <div style={{ marginLeft: 10 }}>
      <ArrayField name={logic} component={[LinkageRuleActions]} disabled={false} initialValue={props.value} />
      <Space size={16} style={{ marginTop: 8, marginBottom: 8 }}>
        <a
          onClick={() => {
            const value = field.value || {};
            const items = value[logic] || [];
            items.push({});
            field.value = {
              [logic]: items,
            };
          }}
        >
          {t('Add action')}
        </a>
      </Space>
    </div>
  );
};
