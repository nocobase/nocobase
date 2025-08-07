/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plugin } from '../application/Plugin';
import { useSystemSettings } from '../system-settings';

interface DocumentTitleContextProps {
  getTitle: () => string;
  setTitle: (title?: any) => void;
}

export const DocumentTitleContext = createContext<DocumentTitleContextProps>({
  getTitle: () => '',
  setTitle: () => {},
});
DocumentTitleContext.displayName = 'DocumentTitleContext';

export const DocumentTitleProvider: React.FC<{ addonBefore?: string; addonAfter?: string }> = React.memo((props) => {
  const { addonBefore, addonAfter } = props;
  const { t } = useTranslation();
  const { t: routeT } = useTranslation('lm-desktop-routes');
  const { t: titleT } = useTranslation('lm-collections');
  const titleRef = React.useRef('');

  const getTitle = useCallback(() => titleRef.current, []);
  const setTitle = useCallback(
    (title) => {
      setTimeout(() => {
        document.title = titleRef.current = `${addonBefore ? ` - ${t(addonBefore)}` : ''}${routeT(title || '')}${
          addonAfter ? ` - ${titleT(addonAfter)}` : ''
        }`;
      });
    },
    [addonAfter, addonBefore, t, routeT, titleT],
  );

  const value = useMemo(() => {
    return {
      getTitle,
      setTitle,
    };
  }, [getTitle, setTitle]);

  return <DocumentTitleContext.Provider value={value}>{props.children}</DocumentTitleContext.Provider>;
});

DocumentTitleProvider.displayName = 'DocumentTitleProvider';

export const RemoteDocumentTitleProvider: React.FC = (props) => {
  const ctx = useSystemSettings();
  return <DocumentTitleProvider addonAfter={ctx?.data?.data?.title}>{props.children}</DocumentTitleProvider>;
};

export const useDocumentTitle = () => {
  return useContext(DocumentTitleContext);
};

export const useCurrentDocumentTitle = (title: string) => {
  const { setTitle } = useDocumentTitle();
  useEffect(() => {
    setTitle(title);
  }, [setTitle, title]);
};

export class RemoteDocumentTitlePlugin extends Plugin {
  async load() {
    this.app.use(RemoteDocumentTitleProvider, this.options);
  }
}
