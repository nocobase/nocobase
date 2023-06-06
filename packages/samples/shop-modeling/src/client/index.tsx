import React from 'react';

const ShopModeling = React.memo((props) => {
  return <>{props.children}</>;
});
ShopModeling.displayName = 'ShopModeling';

export default ShopModeling;
