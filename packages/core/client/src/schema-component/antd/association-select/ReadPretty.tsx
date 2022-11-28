import { observer } from '@formily/react';
import React from 'react';
import { RemoteSelect } from '../remote-select';
import useServiceOptions from './useServiceOptions';

export const ReadPretty = observer((props: any) => {
  const service = useServiceOptions(props);

  return <RemoteSelect.ReadPretty {...props} service={service}></RemoteSelect.ReadPretty>;
});
