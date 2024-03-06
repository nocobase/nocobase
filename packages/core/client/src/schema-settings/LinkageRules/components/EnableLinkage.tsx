import { ArrayBase } from '@formily/antd-v5';
import { Switch } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const EnableLinkage = React.forwardRef((props: any, ref) => {
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex(props.index);
  const { t } = useTranslation();

  return (
    <Switch
      {...props}
      checkedChildren={t('On')}
      unCheckedChildren={t('Off')}
      checked={!array?.field?.value[index].disabled}
      size={'small'}
      style={{
        transition: 'all 0.25s ease-in-out',
        color: 'rgba(0, 0, 0, 0.8)',
        fontSize: 16,
        marginLeft: 6,
        marginBottom: 3,
      }}
      onChange={(checked, e) => {
        e.stopPropagation();
        array.field.value.splice(index, 1, { ...array?.field?.value[index], disabled: !checked });
      }}
      onClick={(checked, e) => {
        e.stopPropagation();
      }}
    />
  );
});
EnableLinkage.displayName = 'EnableLinkage';
