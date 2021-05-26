import React, { Fragment, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { Modal, Drawer as AntdDrawer } from 'antd';
import { DrawerProps } from 'antd/lib/drawer';
import { useContext } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { ModalFuncProps } from 'antd/lib/modal/Modal'
import isNum from 'lodash/isNumber';
import isBool from 'lodash/isBoolean';
import isStr from 'lodash/isString';
import './style.less';

export const usePrefixCls = (
  tag?: string,
  props?: {
    prefixCls?: string;
  },
) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  return getPrefixCls(tag, props?.prefixCls);
};

type DrawerTitle = string | number | React.ReactElement;

const isDrawerTitle = (props: any): props is DrawerTitle => {
  return (
    isNum(props) || isStr(props) || isBool(props) || React.isValidElement(props)
  );
};

const getDrawerProps = (props: any): DrawerProps => {
  if (isDrawerTitle(props)) {
    return {
      title: props,
    };
  } else {
    return props;
  }
};

const createElement = (content, props?: any) => {
  if (!content) {
    return null;
  }
  if (typeof content === 'string') {
    return content;
  }
  if (React.isValidElement(content)) {
    return content;
  }
  return React.createElement(content, props);
};

export interface IDrawer {
  open(props?: any): void;
  close(): void;
}

export function Drawer(title: DrawerProps, content: any): IDrawer;
export function Drawer(title: DrawerTitle, content: any): IDrawer;
export function Drawer(title: any, content: any): IDrawer {
  document.querySelectorAll('.env-root').forEach((el) => {
    el.className = 'env-root env-root-push';
  });
  const env = {
    root: document.createElement('div'),
    promise: null,
  };
  env.root.className = 'env-root';
  const props = getDrawerProps(title);
  const drawerProps = {
    width: '75%',
    ...props,
    onClose: (e: any) => {
      props?.onClose?.(e);
      drawer.close();
    },
    afterVisibleChange: (visible: boolean) => {
      props?.afterVisibleChange?.(visible);
      if (visible) return;
      ReactDOM.unmountComponentAtNode(env.root);
      env.root?.parentNode?.removeChild(env.root);
      env.root = undefined;
    },
  };

  const drawer: any = {
    open: (props: any) => {
      render(
        false,
        () => {
          drawer.closeWithConfirm = null;
          drawer.close();
        },
        () => {
          drawer.close();
        },
      );
      setTimeout(() => {
        render(
          true,
          () => {
            drawer.closeWithConfirm = null;
            drawer.close();
          },
          () => {
            drawer.close();
          },
        );
      });
    },
    close: () => {
      if (!env.root) return;
      if (drawer.closeWithConfirm) {
        Modal.confirm({
          okText: '确定',
          cancelText: '取消',
          ...drawer.closeWithConfirm,
          onOk() {
            drawer.closeWithConfirm = null;
            const els = document.querySelectorAll('.env-root-push');
            if (els.length) {
              const last = els[els.length - 1];
              last.className = 'env-root';
            }
            render(false);
          },
        });
      } else {
        const els = document.querySelectorAll('.env-root-push');
        if (els.length) {
          const last = els[els.length - 1];
          last.className = 'env-root';
        }
        render(false);
      }
    },
    closeWithConfirm: null,
  };

  const closeWithConfirm = (props) => {
    drawer.closeWithConfirm = props;
  };

  const render = (visible = true, resolve?: () => any, reject?: () => any) => {
    ReactDOM.render(
      <ConfigProvider locale={zhCN}>
        <AntdDrawer {...drawerProps} className={'nb-drawer'} visible={visible}>
          {createElement(content, {
            resolve,
            reject,
            closeWithConfirm,
          })}
        </AntdDrawer>
      </ConfigProvider>,
      env.root,
    );
  };
  document.body.appendChild(env.root);

  return drawer;
}

const DrawerFooter: React.FC = (props) => {
  const ref = useRef<HTMLDivElement>();
  const [footer, setFooter] = useState<HTMLDivElement>();
  const footerRef = useRef<HTMLDivElement>();
  const prefixCls = usePrefixCls('drawer');
  useLayoutEffect(() => {
    const content = ref.current?.closest(`.${prefixCls}-wrapper-body`);
    if (content) {
      if (!footerRef.current) {
        footerRef.current = content.querySelector(`.${prefixCls}-footer`);
        if (!footerRef.current) {
          footerRef.current = document.createElement('div');
          footerRef.current.classList.add(`${prefixCls}-footer`);
          content.appendChild(footerRef.current);
        }
      }
      setFooter(footerRef.current);
    }
  });

  footerRef.current = footer;

  return (
    <div ref={ref} style={{ display: 'none' }}>
      {footer && createPortal(props.children, footer)}
    </div>
  );
};

interface ContentPorps {
  resolve?: () => any;
  closeWithConfirm?: (props: ModalFuncProps) => any;
}

Drawer.open = (props: DrawerProps & { content: (contentPorps?: ContentPorps) => any }) => {
  const { content, visible, ...others } = props;
  return Drawer(others, content).open({ visible });
};

Drawer.Footer = DrawerFooter;

export default Drawer;
