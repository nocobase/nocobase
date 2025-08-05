/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';

interface HeaderProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
}

interface FooterProps {
  children: React.ReactNode;
}

interface FlowOverlayContextProps {
  close: () => void;
  update: (newConfig: any) => void;
  Footer: React.FC<FooterProps>;
  Header: React.FC<HeaderProps>;
}

export const FlowOverlayContext = createContext<FlowOverlayContextProps>(null);

export function useFlowOverlay() {
  return useContext(FlowOverlayContext);
}
