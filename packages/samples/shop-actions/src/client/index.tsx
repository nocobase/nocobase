import React from 'react';

const ShopActions = React.memo((props) => {
  return <>{props.children}</>;
});
ShopActions.displayName = 'ShopActions';

export default ShopActions;
