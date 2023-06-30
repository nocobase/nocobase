import React, { useState } from 'react';
import { MapBlockComponent } from '../components';
import { useCollection, useProps } from '@nocobase/client';

export const MapBlock = (props) => {
  const { fieldNames } = useProps(props);
  const { getField } = useCollection();
  const field = getField(fieldNames?.field);
  const fieldComponentProps = field?.uiSchema?.['x-component-props'];
  return <MapBlockComponent {...fieldComponentProps} {...props} />;
};
