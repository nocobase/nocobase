import { ArrayField as ArrayFieldModel, VoidField } from '@formily/core';
import { ArrayField, ObjectField, observer, useField } from '@formily/react';
import { Space } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FormButtonLinkageRuleAction, FormFieldLinkageRuleAction } from './LinkageRuleAction';
import { RemoveActionContext } from './context';
export const LinkageRuleActions = observer(
  (props: any): any => {
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
  },
  { displayName: 'LinkageRuleActions' },
);

interface LinkageRuleActionGroupProps {
  useProps: () => {
    type: 'button' | 'field';
    linkageOptions: any;
    collectionName: string;
  };
}

export const LinkageRuleActionGroup = (props: LinkageRuleActionGroupProps) => {
  const { t } = useTranslation();
  const field = useField<VoidField>();
  const logic = 'actions';
  const { type, linkageOptions, collectionName } = props.useProps();

  const style = useMemo(() => ({ marginLeft: 10 }), []);
  const components = useMemo(
    () => [LinkageRuleActions, { type, linkageOptions, collectionName }],
    [collectionName, linkageOptions, type],
  );
  const spaceStyle = useMemo(() => ({ marginTop: 8, marginBottom: 8 }), []);
  const onClick = useCallback(() => {
    const f = field.query('.actions').take() as ArrayFieldModel;
    const items = f.value || [];
    items.push({});
    f.value = items;
  }, [field]);

  return (
    <div style={style}>
      <ArrayField name={logic} component={components} disabled={false} />
      <Space size={16} style={spaceStyle}>
        <a onClick={onClick}>{t('Add property')}</a>
      </Space>
    </div>
  );
};
