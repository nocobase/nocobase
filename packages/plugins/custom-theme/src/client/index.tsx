import React from 'react';

const CustomThemeProvider = React.memo((props) => {
  return <>{props.children}</>;
});
CustomThemeProvider.displayName = 'CustomThemeProvider';

export default CustomThemeProvider;
