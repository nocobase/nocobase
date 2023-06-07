import React from 'react';

const RateLimit = React.memo((props) => {
  return <>{props.children}</>;
});
RateLimit.displayName = 'RateLimit';

export default RateLimit;
