/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
