import { observer } from '@formily/react';
import { ArrayField, useField, ObjectField } from '@formily/react';
import { ArrayField as ArrayFieldModel } from '@formily/core';
import { Space } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RemoveActionContext } from './context';
import { FormFieldLinkageRuleAction, FormButtonLinkageRuleAction } from './LinkageRuleAction';
export const LinkageRuleActions = observer((props: any): any => {
  const { type, linkageOptions } = props;
  const field = useField<ArrayFieldModel>();
  return field?.value?.map((item, index) => {
    return (
      <RemoveActionContext.Provider key={index} value={() => field.remove(index)}>
        <ObjectField
          name={index}
          component={[
            type === 'button' ? FormButtonLinkageRuleAction : FormFieldLinkageRuleAction,
            { options: linkageOptions },
          ]}
        />
      </RemoveActionContext.Provider>
    );
  });
});

export const LinkageRuleActionGroup = (props) => {
  const { t } = useTranslation();
  const field = useField<any>();
  const logic = 'action';
  const { type, linkageOptions } = props?.useProps();
  return (
    <div style={{ marginLeft: 10 }}>
      <ArrayField name={logic} component={[LinkageRuleActions, { type, linkageOptions }]} disabled={false} />
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
          {t('Add property')}
        </a>
      </Space>
    </div>
  );
};
