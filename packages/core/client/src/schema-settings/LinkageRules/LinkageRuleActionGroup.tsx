import { ArrayField as ArrayFieldModel, VoidField } from '@formily/core';
import { ArrayField, ObjectField, observer, useField } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RemoveActionContext } from './context';
import { FormButtonLinkageRuleAction, FormFieldLinkageRuleAction } from './LinkageRuleAction';
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
            { ...props, options: linkageOptions },
          ]}
        />
      </RemoveActionContext.Provider>
    );
  });
});

export const LinkageRuleActionGroup = (props) => {
  const { t } = useTranslation();
  const field = useField<VoidField>();
  const logic = 'actions';
  const { type, linkageOptions, collectionName } = props?.useProps();
  return (
    <div style={{ marginLeft: 10 }}>
      <ArrayField
        name={logic}
        component={[LinkageRuleActions, { type, linkageOptions, collectionName }]}
        disabled={false}
      />
      <Space size={16} style={{ marginTop: 8, marginBottom: 8 }}>
        <a
          onClick={() => {
            const f = field.query('.actions').take() as ArrayFieldModel;
            const items = f.value || [];
            items.push({});
            f.value = items;
          }}
        >
          {t('Add property')}
        </a>
      </Space>
    </div>
  );
};
