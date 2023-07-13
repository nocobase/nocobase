import { observer } from '@formily/react';
import React from 'react';
import { useFieldTitle } from '../../hooks';
import { RemoteSelect } from '../remote-select';
import useServiceOptions from './useServiceOptions';

export const ReadPretty = observer(
  (props: any) => {
    const service = useServiceOptions(props);
    useFieldTitle();
    return <RemoteSelect.ReadPretty {...props} service={service}></RemoteSelect.ReadPretty>;
  },
  { displayName: 'ReadPretty' },
);
