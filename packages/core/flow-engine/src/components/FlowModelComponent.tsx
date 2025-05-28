import React from 'react';
import { FlowModel } from '../models';
import { useApplyAutoFlows, useFlowContext } from '../hooks';

interface FlowModelComponentProps {
  model: FlowModel;
}

/**
 * A React component responsible for rendering a FlowModel.
 * It delegates the actual rendering logic to the `render` method of the provided model.
 *
 * @param {FlowModelComponentProps} props - The component's props.
 * @param {FlowModel} props.model - The FlowModel instance to render.
 * @returns {React.ReactNode | null} The rendered output of the model, or null if the model or its render method is invalid.
 */
export const FlowModelComponent: React.FC<FlowModelComponentProps> = ({ model }) => {
  const flowContext = useFlowContext();
  useApplyAutoFlows(model, flowContext);
  if (!model || typeof model.render !== 'function') {
    // 可以选择渲染 null 或者一个错误/提示信息
    console.warn('FlowModelComponent: Invalid model or render method not found.', model);
    return null;
  }
  return model.render();
};