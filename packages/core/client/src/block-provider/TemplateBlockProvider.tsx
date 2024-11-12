/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TemplateBlockContext = createContext<{
  // 模板是否已经请求结束
  templateFinished?: boolean;
  onTemplateSuccess?: Function;
}>({});
TemplateBlockContext.displayName = 'TemplateBlockContext';

/**
 * @internal
 */
export const useTemplateBlockContext = () => {
  return useContext(TemplateBlockContext);
};

const TemplateBlockProvider = (props) => {
  const [templateFinished, setTemplateFinished] = useState(false);
  const onTemplateSuccess = useCallback(() => setTemplateFinished(true), []);
  const value = useMemo(() => ({ templateFinished, onTemplateSuccess }), [onTemplateSuccess, templateFinished]);
  return <TemplateBlockContext.Provider value={value}>{props.children}</TemplateBlockContext.Provider>;
};

export { TemplateBlockProvider };
