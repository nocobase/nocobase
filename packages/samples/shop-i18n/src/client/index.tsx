import React from 'react';

export default React.memo((props) => {
  return <>{props.children}</>;
});
