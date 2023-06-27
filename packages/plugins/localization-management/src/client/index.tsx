import React from 'react';

const MyProvider = React.memo((props) => {
  return <>{props.children}</>;
});
MyProvider.displayName = 'MyProvider';

export default MyProvider;
