import React, { createContext, useContext, useState } from 'react';
import { Helmet } from 'react-helmet';

interface DocumentTitleContextProps {
  title?: any;
  setTitle?: (title?: any) => void;
}

export const DocumentTitleContext = createContext<DocumentTitleContextProps>({
  title: null,
  setTitle() {},
});

export const DocumentTitleProvider: React.FC<{ addonBefore?: string; addonAfter?: string }> = (props) => {
  const { addonBefore, addonAfter } = props;
  const [title, setTitle] = useState('');
  const documentTitle = `${addonBefore ? ` - ${addonBefore}` : ''}${title || ''}${
    addonAfter ? ` - ${addonAfter}` : ''
  }`;
  return (
    <DocumentTitleContext.Provider
      value={{
        title,
        setTitle,
      }}
    >
      <Helmet>
        <title>{documentTitle}</title>
      </Helmet>
      {props.children}
    </DocumentTitleContext.Provider>
  );
};

export const useDocumentTitle = () => {
  return useContext(DocumentTitleContext);
};
