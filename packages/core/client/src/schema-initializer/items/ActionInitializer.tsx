import React from 'react';

import { InitializerWithSwitch } from './InitializerWithSwitch';

export const ActionInitializer = (props) => {
  return <InitializerWithSwitch {...props} type={'x-action'} />;
};
