import React, { Fragment, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM, { createPortal } from 'react-dom'
import { createForm } from '@formily/core'
// import { FormProvider } from '@formily/react'
import { isNum, isStr, isBool, isFn } from '@formily/shared'
import { Drawer } from 'antd'
import { DrawerProps } from 'antd/lib/drawer'
import { useContext } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN';

export const usePrefixCls = (
  tag?: string,
  props?: {
    prefixCls?: string
  }
) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext)
  return getPrefixCls(tag, props?.prefixCls)
}

type DrawerTitle = string | number | React.ReactElement

const isDrawerTitle = (props: any): props is DrawerTitle => {
  return (
    isNum(props) || isStr(props) || isBool(props) || React.isValidElement(props)
  )
}

const getDrawerProps = (props: any): DrawerProps => {
  if (isDrawerTitle(props)) {
    return {
      title: props,
    }
  } else {
    return props
  }
}

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
}

export interface IFormDrawer {
  open(props?: any): void
  close(): void
}

export function FormDrawer(
  title: DrawerProps,
  content: any,
): IFormDrawer
export function FormDrawer(
  title: DrawerTitle,
  content: any,
): IFormDrawer
export function FormDrawer(title: any, content: any): IFormDrawer {
  document.querySelectorAll('.env-root').forEach(el => {
    el.className = 'env-root env-root-push';
  });
  const env = {
    root: document.createElement('div'),
    promise: null,
  }
  env.root.className = 'env-root';
  const props = getDrawerProps(title)
  const drawer = {
    width: '50%',
    ...props,
    onClose: (e: any) => {
      props?.onClose?.(e)
      formDrawer.close()
    },
    afterVisibleChange: (visible: boolean) => {
      props?.afterVisibleChange?.(visible)
      if (visible) return
      ReactDOM.unmountComponentAtNode(env.root)
      env.root?.parentNode?.removeChild(env.root)
      env.root = undefined
    },
  }
  const render = (visible = true, resolve?: () => any, reject?: () => any) => {
    ReactDOM.render(
      <ConfigProvider locale={zhCN}>
        <Drawer {...drawer} visible={visible}>
          {createElement(content, {
            resolve,
            reject,
          })}
        </Drawer>
      </ConfigProvider>,
      env.root
    )
  }
  document.body.appendChild(env.root)
  const formDrawer = {
    open: (props: any) => {
      render(
        false,
        () => {
          formDrawer.close()
        },
        () => {
          formDrawer.close()
        }
      )
      setTimeout(() => {
        render(
          true,
          () => {
            formDrawer.close()
          },
          () => {
            formDrawer.close()
          }
        )
      })
    },
    close: () => {
      if (!env.root) return
      const els = document.querySelectorAll('.env-root-push');
      if (els.length) {
        const last = els[els.length-1];
        last.className = 'env-root';
      }
      render(false)
    },
  }
  return formDrawer
}

const DrawerFooter: React.FC = (props) => {
  const ref = useRef<HTMLDivElement>()
  const [footer, setFooter] = useState<HTMLDivElement>()
  const footerRef = useRef<HTMLDivElement>()
  const prefixCls = usePrefixCls('drawer')
  useLayoutEffect(() => {
    const content = ref.current?.closest(`.${prefixCls}-wrapper-body`)
    if (content) {
      if (!footerRef.current) {
        footerRef.current = content.querySelector(`.${prefixCls}-footer`)
        if (!footerRef.current) {
          footerRef.current = document.createElement('div')
          footerRef.current.classList.add(`${prefixCls}-footer`)
          content.appendChild(footerRef.current)
        }
      }
      setFooter(footerRef.current)
    }
  })

  footerRef.current = footer

  return (
    <div ref={ref} style={{ display: 'none' }}>
      {footer && createPortal(props.children, footer)}
    </div>
  )
}

FormDrawer.open = (props) => {
  const { content, visible, ...rest } = props;
  return FormDrawer(rest, content).open({visible});
}

FormDrawer.Footer = DrawerFooter

export default FormDrawer
