import React from 'react';
import type { Locale } from './interface';
import zhCN from './zh-CN';

export const LocaleContext = React.createContext<Locale>(zhCN);

export const useLocale = () => React.useContext(LocaleContext);
