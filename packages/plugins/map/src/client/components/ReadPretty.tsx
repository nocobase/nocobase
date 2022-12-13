import { useFormBlockContext } from '@nocobase/client';
import React from 'react';
import AMapComponent from './AMap';

const ReadPretty = (props) => {
  const { value, readPretty } = props;

  if (!readPretty)
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
