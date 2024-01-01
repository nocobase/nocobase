import { registerField, registerGroup, useCurrentAppInfo } from '@nocobase/client';
import React, { useEffect } from 'react';
import { fieldInterfaces } from './fields';
import { generateNTemplate } from './locale';
import './locale';

export const useRegisterInterface = () => {
  const { data } = useCurrentAppInfo() || {};
  useEffect(() => {
    const dialect = data?.database.dialect;
    if (!dialect) return;

    registerGroup(fieldInterfaces[0].group, {
      label: generateNTemplate('Map-based geometry'),
      order: 51,
    });

    fieldInterfaces.forEach((field) => {
      if (Array.isArray(field.getOption('dialects'))) {
        if (!field.getOption('dialects').includes(dialect)) {
          return;
        }
      }
      registerField(field.group, field.name as string, field);
    });
  }, [data]);
};

export const MapInitializer: React.FC = (props) => {
  useRegisterInterface();
  return <React.Fragment>{props.children}</React.Fragment>;
};
