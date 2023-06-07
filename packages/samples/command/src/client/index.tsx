import React from 'react';

const CommandMemo = React.memo((props) => {
  return <>{props.children}</>;
});
CommandMemo.displayName = 'CommandMemo';

export default CommandMemo;
