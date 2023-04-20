import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ActionContextProvider, AdminProvider, RemoteSchemaComponent, useRoute } from '@nocobase/client';
import { css, cx } from '@emotion/css';
import { useInterfaceContext } from './InterfaceProvider';
import { DrawerProps, ModalProps } from 'antd';

const drawerProps: DrawerProps = {
  getContainer: '.nb-mobile-application',
  width: '90%',
  style: {
    position: 'absolute',
  },
};
const modalProps = {
  ...drawerProps,
  style: {
    maxWidth: 'calc(100% - 16px)',
  },
  maskStyle: {
    position: 'absolute',
  },
  wrapClassName: css`
    position: absolute;
  `,
};

const MApplication: React.FC = (props) => {
  const route = useRoute();
  const params = useParams<{ name: string }>();
  const interfaceContext = useInterfaceContext();
  const Provider = useMemo(() => {
    return interfaceContext ? React.Fragment : AdminProvider;
  }, [interfaceContext]);
  return (
    <Provider>
      <ActionContextProvider modalProps={modalProps as ModalProps} drawerProps={drawerProps}>
        <div
          className={cx(
            'nb-mobile-application',
            css`
              display: flex;
              flex-direction: column;
              width: 100%;
              height: 100%;
              position: relative;
              overflow: hidden;
            `,
          )}
        >
          {params.name && !params.name.startsWith('tab_') ? (
            props.children
          ) : (
            <RemoteSchemaComponent key={route.uiSchemaUid} uid={route.uiSchemaUid}>
              {props.children}
            </RemoteSchemaComponent>
          )}
        </div>
      </ActionContextProvider>
    </Provider>
  );
};

export default MApplication;
