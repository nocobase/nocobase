import React, { FC, useMemo } from 'react';
import { upperFirst } from 'lodash';

import { useFindComponent } from '../../../schema-component';
import { SchemaSettingItemType } from '../types';
import { SchemaSettings } from '../../../schema-settings';
import { SchemaSettingItemContext } from '../context';

export interface SchemaSettingChildrenProps {
  children: SchemaSettingItemType[];
}

export const SchemaSettingChildren: FC<SchemaSettingChildrenProps> = (props) => {
  const { children } = props;
  if (!children || children.length === 0) return null;
  return (
    <>
      {children
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item, index) => (
          <SchemaSettingChild key={item.name || item.key || index} {...item} />
        ))}
    </>
  );
};

const useChildrenDefault = () => undefined;
const useComponentPropsDefault = () => undefined;
const useVisibleDefault = () => true;
export const SchemaSettingChild: FC<SchemaSettingItemType> = (props) => {
  const {
    useVisible = useVisibleDefault,
    useChildren = useChildrenDefault,
    useComponentProps = useComponentPropsDefault,
    type,
    Component,
    children,
    checkChildrenLength,
    componentProps,
    sort: _unUse,
    ...others
  } = props;
  const useChildrenRes = useChildren();
  const useComponentPropsRes = useComponentProps();
  const findComponent = useFindComponent();
  const componentChildren = useChildrenRes || children;
  const contextValue = useMemo(() => {
    return {
      ...others,
      children: componentChildren,
    };
  }, [componentChildren, others]);
  const visibleResult = useVisible();
  const ComponentValue = useMemo(() => {
    return !Component && type && (SchemaSettings[upperFirst(type)] || SchemaSettings[upperFirst(`${type}Item`)])
      ? SchemaSettings[upperFirst(type)] || SchemaSettings[upperFirst(`${type}Item`)]
      : Component;
  }, [type, Component]);

  if (!visibleResult) return null;
  if (!type && !Component) return null;

  const C = findComponent(ComponentValue);
  if (!C) {
    return null;
  }
  if (checkChildrenLength && Array.isArray(componentChildren) && componentChildren.length === 0) {
    return null;
  }

  return (
    <SchemaSettingItemContext.Provider value={contextValue}>
      <C {...componentProps} {...useComponentPropsRes}>
        {Array.isArray(componentChildren) && componentChildren.length > 0 && (
          <SchemaSettingChildren>{componentChildren}</SchemaSettingChildren>
        )}
      </C>
    </SchemaSettingItemContext.Provider>
  );
};
