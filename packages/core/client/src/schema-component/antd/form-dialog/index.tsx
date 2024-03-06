import { createForm, Form, IFormProps } from '@formily/core';
import { FormProvider, Observer, observer, ReactFC } from '@formily/react';
import { toJS } from '@formily/reactive';
import { applyMiddleware, IMiddleware, isBool, isFn, isNum, isStr } from '@formily/shared';
import { Modal, ModalProps, ThemeConfig } from 'antd';
import React, { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GlobalThemeProvider } from '../../../global-theme';
import { createPortalProvider, createPortalRoot, loading, usePrefixCls, useToken } from '../__builtins__';

type FormDialogRenderer = React.ReactElement | ((form: Form) => React.ReactElement);

type ModalTitle = string | number | React.ReactElement;

const isModalTitle = (props: any): props is ModalTitle => {
  return isNum(props) || isStr(props) || isBool(props) || React.isValidElement(props);
};

const getModelProps = (props: any): IModalProps => {
  if (isModalTitle(props)) {
    return {
      title: props,
    };
  } else {
    return props;
  }
};

export interface IFormDialog {
  forOpen(middleware: IMiddleware<IFormProps>): IFormDialog;
  forConfirm(middleware: IMiddleware<Form>): IFormDialog;
  forCancel(middleware: IMiddleware<Form>): IFormDialog;
  open(props?: IFormProps): Promise<any>;
  close(): void;
}

export interface IModalProps extends ModalProps {
  onOk?: (event: React.MouseEvent<HTMLElement>) => void | boolean;
  onCancel?: (event: React.MouseEvent<HTMLElement>) => void | boolean;
  loadingText?: React.ReactNode;
}

interface IEnv {
  form: Form | null;
  host: HTMLDivElement;
  promise: Promise<any> | null;
  openMiddlewares: IMiddleware<IFormProps>[];
  confirmMiddlewares: IMiddleware<Form>[];
  cancelMiddlewares: IMiddleware<Form>[];
}

export function FormDialog(title: IModalProps, id: string, renderer: FormDialogRenderer): IFormDialog;
export function FormDialog(title: IModalProps, renderer: FormDialogRenderer): IFormDialog;
export function FormDialog(title: IModalProps, renderer: FormDialogRenderer, theme: ThemeConfig): IFormDialog;
export function FormDialog(title: ModalTitle, id: string, renderer: FormDialogRenderer): IFormDialog;
export function FormDialog(title: ModalTitle, renderer: FormDialogRenderer): IFormDialog;

export function FormDialog(title: any, id: any, renderer?: any, theme?: any): IFormDialog {
  if (isFn(id) || React.isValidElement(id)) {
    theme = renderer;
    renderer = id;
    id = 'form-dialog';
  }
  const env: IEnv = {
    host: document.createElement('div'),
    form: null as unknown as Form,
    promise: null,
    openMiddlewares: [],
    confirmMiddlewares: [],
    cancelMiddlewares: [],
  };
  const root = createPortalRoot(env.host, id);
  const props = getModelProps(title);
  const modal = {
    ...props,
    afterClose: () => {
      props?.afterClose?.();
      root.unmount();
    },
  };
  const DialogContent = observer(
    () => {
      return <Fragment>{isFn(renderer) ? renderer(env.form) : renderer}</Fragment>;
    },
    { displayName: 'DialogContent' },
  );
  const renderDialog = (open = true, resolve?: () => any, reject?: () => any) => {
    const { form } = env;
    if (!form) return null;
    return (
      <GlobalThemeProvider theme={theme}>
        <Observer>
          {() => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { token } = useToken();

            return (
              <Modal
                // fix https://nocobase.height.app/T-2797
                // fix https://nocobase.height.app/T-2838
                zIndex={token.zIndexPopupBase + 1000}
                {...modal}
                open={open}
                confirmLoading={form.submitting}
                onCancel={(e) => {
                  if (modal?.onCancel?.(e) !== false) {
                    reject?.();
                  }
                }}
                onOk={async (e) => {
                  if (modal?.onOk?.(e) !== false) {
                    resolve?.();
                  }
                }}
              >
                <FormProvider form={form}>
                  <DialogContent />
                </FormProvider>
              </Modal>
            );
          }}
        </Observer>
      </GlobalThemeProvider>
    );
  };

  document.body.appendChild(env.host);
  const formDialog = {
    forOpen: (middleware: IMiddleware<IFormProps>) => {
      if (isFn(middleware)) {
        env.openMiddlewares.push(middleware);
      }
      return formDialog;
    },
    forConfirm: (middleware: IMiddleware<Form>) => {
      if (isFn(middleware)) {
        env.confirmMiddlewares.push(middleware);
      }
      return formDialog;
    },
    forCancel: (middleware: IMiddleware<Form>) => {
      if (isFn(middleware)) {
        env.cancelMiddlewares.push(middleware);
      }
      return formDialog;
    },
    open: async (props: IFormProps) => {
      if (env.promise) return env.promise;
      // eslint-disable-next-line no-async-promise-executor
      env.promise = new Promise(async (resolve, reject) => {
        try {
          props = await loading(modal.loadingText, () => applyMiddleware(props, env.openMiddlewares));
          env.form = env.form || createForm(props);
        } catch (e) {
          reject(e);
        }
        root.render(() =>
          renderDialog(
            true,
            () => {
              env.form
                ?.submit(async () => {
                  await applyMiddleware(env.form, env.confirmMiddlewares);
                  resolve(toJS(env.form?.values));
                  formDialog.close();
                })
                .catch(() => {});
            },
            async () => {
              await loading(modal.loadingText, () => applyMiddleware(env.form, env.cancelMiddlewares));
              formDialog.close();
            },
          ),
        );
      });
      return env.promise;
    },
    close: () => {
      if (!env.host) return;
      root.render(() => renderDialog(false));
    },
  };
  return formDialog;
}

const DialogFooter: ReactFC = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [footer, setFooter] = useState<HTMLDivElement>();
  const footerRef = useRef<HTMLDivElement>();
  const prefixCls = usePrefixCls('modal');
  useLayoutEffect(() => {
    const content = ref.current?.closest(`.${prefixCls}-content`);
    if (content) {
      if (!footerRef.current) {
        footerRef.current = content.querySelector(`.${prefixCls}-footer`) as HTMLDivElement;
        if (!footerRef.current) {
          footerRef.current = document.createElement('div');
          footerRef.current.classList.add(`${prefixCls}-footer`);
          content.appendChild(footerRef.current);
        }
      }
      setFooter(footerRef.current);
    }
  }, [prefixCls]);

  footerRef.current = footer;

  return (
    <div ref={ref} style={{ display: 'none' }}>
      {footer && createPortal(props.children, footer)}
    </div>
  );
};

FormDialog.Footer = DialogFooter;

FormDialog.Portal = createPortalProvider('form-dialog');

export default FormDialog;
