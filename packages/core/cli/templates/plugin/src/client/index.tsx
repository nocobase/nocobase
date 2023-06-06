import React from 'react';

const CommonMemo = React.memo((props) => {
  return <>{props.children}</>;
});
CommonMemo.displayName = 'CommonMemo';

export default CommonMemo;
