import React from 'react';
const ReadPretty = ({ value }) => {
  return <div>{value?.join(',')}</div>;
};

export default ReadPretty;
