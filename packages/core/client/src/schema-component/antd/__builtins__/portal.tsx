import { Observer, ReactFC } from '@formily/react';
import { observable } from '@formily/reactive';
import React, { Fragment } from 'react';
import { createPortal } from 'react-dom';
import { render as reactRender, unmount as reactUnmount } from './render';
export interface IPortalProps {
  id?: string | symbol;
}

const PortalMap = observable(new Map<string | symbol, React.ReactNode>());

export const createPortalProvider = (id: string | symbol) => {
  const Portal: ReactFC<IPortalProps> = (props) => {
    if (props.id && !PortalMap.has(props.id)) {
      PortalMap.set(props.id, null);
    }

    return (
      <Fragment>
        {props.children}
        <Observer>
          {() => {
            if (!props.id) return <></>;
            const portal = PortalMap.get(props.id);
            if (portal) return createPortal(portal, document.body);
            return <></>;
          }}
        </Observer>
      </Fragment>
    );
  };
  Portal.defaultProps = {
    id,
  };
  return Portal;
};

export function createPortalRoot<T extends React.ReactNode>(host: HTMLElement, id: string) {
  function render(renderer?: () => T) {
    if (PortalMap.has(id)) {
      PortalMap.set(id, renderer?.());
    } else if (host) {
      reactRender(<Fragment>{renderer?.()}</Fragment>, host);
    }
  }

  function unmount() {
    if (PortalMap.has(id)) {
      PortalMap.set(id, null);
    }
    if (host) {
      const unmountResult = reactUnmount(host);
      if (unmountResult && host.parentNode) {
        host.parentNode?.removeChild(host);
      }
    }
  }

  return {
    render,
    unmount,
  };
}
