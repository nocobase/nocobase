/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowModelRenderer, FlowViewContextProvider, useFlowContext } from '@nocobase/flow-engine';
import type { FlowModel } from '@nocobase/flow-engine';
import { Spin } from 'antd';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PublicFormsSettingsDetailView } from '../models/PublicFormsSettingsLayoutModel';

function getPublicFormPageModel(routeModel: FlowModel) {
  const page = routeModel.subModels?.page;
  return Array.isArray(page) ? page[0] : page;
}

type EmbedFlowView = {
  type: 'embed';
  inputArgs: Record<string, unknown>;
  Header: null;
  Footer: null;
  close: () => Promise<void>;
  update: () => void;
};

function PublicFormPageRenderer(props: { model: FlowModel }) {
  const { model } = props;
  const ctx = useFlowContext();
  const [attachedContext, setAttachedContext] = useState<{ model: FlowModel; context: FlowContext } | null>(null);
  const viewContext = useMemo(() => {
    const view: EmbedFlowView = {
      type: 'embed',
      inputArgs: {},
      Header: null,
      Footer: null,
      close: async () => undefined,
      update: () => undefined,
    };
    const nextContext = new FlowContext();

    if (ctx instanceof FlowContext) {
      nextContext.addDelegate(ctx);
    }

    nextContext.defineProperty('view', {
      value: view,
    });
    nextContext.defineProperty('flowSettingsEnabled', {
      get: () => !!ctx?.flowSettingsEnabled,
      cache: false,
    });
    return nextContext;
  }, [ctx]);
  const needsModelDelegate = useMemo(() => {
    if (model.context instanceof FlowContext && viewContext instanceof FlowContext) {
      return true;
    }
    return false;
  }, [model.context, viewContext]);

  useLayoutEffect(() => {
    if (!(model.context instanceof FlowContext) || !(viewContext instanceof FlowContext)) {
      setAttachedContext(null);
      return;
    }

    model.context.addDelegate(viewContext);
    setAttachedContext({ model, context: viewContext });

    return () => {
      if (model.context instanceof FlowContext) {
        model.context.removeDelegate(viewContext);
      }
    };
  }, [model, model.context, viewContext]);

  if (needsModelDelegate && (attachedContext?.model !== model || attachedContext.context !== viewContext)) {
    return <Spin />;
  }

  return (
    <FlowViewContextProvider context={viewContext}>
      <FlowModelRenderer model={model} showFlowSettings={false} />
    </FlowViewContextProvider>
  );
}

export default function PublicFormsSettingsDetailPage() {
  const params = useParams<{ name?: string }>();
  const pageUid = params.name;

  return (
    <PublicFormsSettingsDetailView pageUid={pageUid}>
      {(routeModel) => {
        const pageModel = getPublicFormPageModel(routeModel);

        if (!pageModel) {
          return <Spin />;
        }

        return <PublicFormPageRenderer model={pageModel} />;
      }}
    </PublicFormsSettingsDetailView>
  );
}
