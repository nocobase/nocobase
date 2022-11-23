import React, { useState } from 'react';
import { Row, Col } from 'antd';
import { CopyOutlined, ToolOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { Operand, VariableTypes, VariableTypesContext } from '../calculators';
import { Button, Input, message, Tooltip } from 'antd';
import { useFlowContext } from '../FlowContext';
import { useCollectionManager, useCompile } from '@nocobase/client';
import { useWorkflowTranslation } from '../locale';

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
              return `<%= node[${options.nodeId}].${options.path} // ${compile(
                field.uiSchema?.title || field.name,
              )} %>`;
            }
            return `<%= node[${options.nodeId}].${options.path}%>`;
          }
        }
      }
  }
  return '';
}

const AvailableVariableTool = (props) => {
  const { t } = useWorkflowTranslation();
  const [operand, setOperand] = useState({ type: '$context', value: '' });
  return (
    <Row style={{ width: '100%' }}>
      <Col span={10}>
        <Operand value={operand} onChange={(v) => setOperand(v)} />
      </Col>
      <Col span={10}>
        <Input value={getVal(operand)} disabled />
      </Col>
      <Col span={4}>
        <CopyToClipboard
          text={getVal(operand)}
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
          <Tooltip title={t('Copy variable output template statement')}>
            <Button icon={<CopyOutlined />} />
          </Tooltip>
        </CopyToClipboard>
      </Col>
    </Row>
  );
};

export default function (props) {
  const [showTool, setShowTool] = useState(false);
  const { t } = useWorkflowTranslation();
  const requestVariableTypes = {
    $context: VariableTypes.$context,
    $jobsMapByNodeId: VariableTypes.$jobsMapByNodeId,
  };
  return (
    <VariableTypesContext.Provider value={requestVariableTypes}>
      <Row style={{ width: '100%' }}>
        <Col span={24}>
          <Tooltip title={t('Show available variable tool')}>
            <Button type={'text'} icon={<ToolOutlined />} onClick={() => setShowTool(!showTool)} />
          </Tooltip>
        </Col>
      </Row>
      {showTool && <AvailableVariableTool></AvailableVariableTool>}

      <Row style={{ width: '100%' }}>
        <Col span={24}>
          <Input.TextArea {...props} />
        </Col>
      </Row>
      {showTool && (
        <Row>
          <Col span={24}>
            <div className="ant-formily-item-extra">
              {props.description}
              {' '}
              {t('Syntax see')}{' '}
              <a target={'_blank'} href={'https://ejs.co'}>
                ejs
              </a>
              {' '}
            </div>
          </Col>
        </Row>
      )}
    </VariableTypesContext.Provider>
  );
}
