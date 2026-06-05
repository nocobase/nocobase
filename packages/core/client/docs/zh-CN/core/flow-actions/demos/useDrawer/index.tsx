import * as React from 'react';
import DrawerComponent from './DrawerComponent';
import usePatchElement from './usePatchElement';

let uuid = 0;

function useDrawer() {
  const holderRef = React.useRef(null);

  const open = (config) => {
    uuid += 1;
    const drawerRef = React.createRef<{ destroy: () => void; update: (config: any) => void }>();

    // eslint-disable-next-line prefer-const
    let closeFunc: (() => void) | undefined;
    const drawer = (
      <DrawerComponent
        key={`drawer-${uuid}`}
        ref={drawerRef}
        {...config}
        afterClose={() => {
          closeFunc?.();
          config.onClose?.();
        }}
      />
    );
    closeFunc = holderRef.current?.patchElement(drawer);

    return {
      destroy: () => drawerRef.current?.destroy(),
      update: (newConfig) => drawerRef.current?.update(newConfig),
    };
  };

  const api = React.useMemo(() => ({ open }), []);
  const ElementsHolder = React.memo(
    React.forwardRef((props, ref) => {
      const [elements, patchElement] = usePatchElement();
      React.useImperativeHandle(ref, () => ({ patchElement }), []);
      return <>{elements}</>;
    }),
  );

  return [api, <ElementsHolder key="drawer-holder" ref={holderRef} />];
}

export default useDrawer;
