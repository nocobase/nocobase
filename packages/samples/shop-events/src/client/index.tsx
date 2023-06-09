import React from 'react';

const ShopEvents = React.memo((props) => {
  return <>{props.children}</>;
});
ShopEvents.displayName = 'ShopEvents';

export default ShopEvents;
