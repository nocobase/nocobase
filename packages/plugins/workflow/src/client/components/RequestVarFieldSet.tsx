import { css } from '@emotion/css';
import React from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { Operand, VariableTypes, VariableTypesContext } from '../calculators';
import { Button, Input, message, Tooltip } from 'antd';
import { useFlowContext } from '../FlowContext';
import { useCollectionManager, useCompile } from '@nocobase/client';
import { useWorkflowTranslation} from '../locale';

function getVal(operand) {
  const { options } = operand;
  const { t } = useWorkflowTranslation();
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { nodes } = useFlowContext();

  switch (operand.type) {
    case '$context':
      if (options?.path) {
        return `<%=ctx.${options.path}%>`;
      }
      break;
    case '$jobsMapByNodeId':
      if (options?.nodeId) {
        const node = nodes.find((n) => n.id == options.nodeId);
        if (node) {
          if (node.type === 'calculation') {
            return `<%= node.${options.nodeId} // ${t('Calculation result')} %>`;
          }
          if (options.path && node?.config?.collection) {
            const fields = getCollectionFields(node?.config?.collection);
            const field = fields.find((f) => f.name == options.path);
            if (field) {

              return `<%= node[${options.nodeId}].${options.path} // ${compile(field.uiSchema?.title || field.name)} %>`;
            }
            return `<%= node[${options.nodeId}].${options.path}%>`;
          }
        }
      }
  }
  return '';
}

export function RequestVarFieldSet({ calculator, operands = [{ type: '$context', value: '' }], onChange }) {
  const { t } = useWorkflowTranslation();
  const requestVariableTypes = {
    $context: VariableTypes.$context,
    $jobsMapByNodeId: VariableTypes.$jobsMapByNodeId,
  };
  return (
    <VariableTypesContext.Provider value={requestVariableTypes}>
      <div
        className={css`
          display: flex;
          gap: 0.5em;
          align-items: center;
        `}
      >
        <Operand value={operands[0]} onChange={(v) => onChange({ calculator, operands: [v, operands[1]] })} />

        <Input.Group compact>
          <Input style={{ width: 'calc(100% - 200px)' }} value={getVal(operands[0])} disabled />
          <CopyToClipboard
            text={getVal(operands[0])}
            onCopy={() => {
              message.success({
                content: t('Copy success!'),
                duration: 1,
                style: {
                  marginTop: '20vh',
                },
              });
            }}
          >
            <Tooltip title={t("Copy variable output template statement")}>
              <Button icon={<CopyOutlined />} />
            </Tooltip>
          </CopyToClipboard>
        </Input.Group>
      </div>
    </VariableTypesContext.Provider>
  );
}
