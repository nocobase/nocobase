import React, { createContext, useContext, useState } from 'react';

const TemplateBlockContext = createContext<{
  // 模板是否已经请求结束
  templateFinshed?: boolean;
  onTemplateSuccess?: Function;
}>({});
TemplateBlockContext.displayName = 'TemplateBlockContext';

export const useTemplateBlockContext = () => {
  return useContext(TemplateBlockContext);
};

const TemplateBlockProvider = (props) => {
  const [templateFinshed, setTemplateFinshed] = useState(false);
  return (
    <TemplateBlockContext.Provider value={{ templateFinshed, onTemplateSuccess: () => setTemplateFinshed(true) }}>
      {props.children}
    </TemplateBlockContext.Provider>
  );
};

export { TemplateBlockProvider };
