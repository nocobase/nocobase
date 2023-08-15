import { RecursionField } from '@formily/react';
import React from 'react';

const schema = {
  type: 'void',
  'x-component': 'Form',
  properties: {},
};

export const CustomsRequests = () => {
  return (
    <div>
      <RecursionField schema={schema} />
    </div>
  );
};
