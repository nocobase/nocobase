import React from 'react';
const ReadPretty = ({ value }) => {
  return (
    <div
      style={{
        whiteSpace: 'pre-wrap',
      }}
    >
      {value?.join(',')}
    </div>
  );
};

export default ReadPretty;
