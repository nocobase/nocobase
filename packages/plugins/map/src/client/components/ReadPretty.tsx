import { useFormBlockContext } from '@nocobase/client';
import React from 'react';
import AMapComponent from './AMap';

const ReadPretty = (props) => {
  const { value } = props;
  const form = useFormBlockContext();
  if (!form?.field)
    return (
      <div
        style={{
          whiteSpace: 'pre-wrap',
        }}
      >
        {value?.join(',')}
      </div>
    );
  return <AMapComponent {...props}></AMapComponent>;
};

export default ReadPretty;
