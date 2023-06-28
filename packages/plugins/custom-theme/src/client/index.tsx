import React from 'react';
import CustomTheme from './theme-editor';

const CustomThemeProvider = React.memo((props) => {
  return <>{props.children}</>;

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ transform: 'rotate(0)', flexGrow: 1 }}>{props.children}</div>
      <div style={{ overflow: 'hidden' }}>
        <CustomTheme />
      </div>
    </div>
  );
});
CustomThemeProvider.displayName = 'CustomThemeProvider';

export default CustomThemeProvider;
