import React, { useState } from 'react';
import { Row, Col } from 'antd';
import { CopyOutlined, ToolOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import {Operand, VariableTypes, VariableTypesContext} from '../variable';
import { Button, Input, message, Tooltip } from 'antd';
import { useFlowContext } from '../FlowContext';
import { useCollectionManager, useCompile } from '@nocobase/client';
import {useWorkflowTranslation} from '../locale';

function getVal(operand) {
  const { t } = useWorkflowTranslation();
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { nodes } = useFlowContext();

  if (typeof operand === 'string') {
    let pathArr = operand.replace('{{', '').replace('}}', '').split('.');
    if (pathArr.length > 0) {
      const type = pathArr[0];
      if (type == '$context') {
        return `<%=${pathArr.map((value, index) => {
          if (index === 0) {
            return 'ctx';
          }
          return value;
        }).join('.')}%>`;
      }
      if (pathArr.length>1 && type == '$jobsMapByNodeId') {
        const nodeId = pathArr[1]
        const node = nodes.find((n) => n.id == nodeId);
        if (node) {
          if (node.type === 'calculation') {
            return `<%= node[${nodeId}] // ${t('Calculation result')} %>`;
          }
          if (pathArr.length>2 && node?.config?.collection) {
            const fieldName = pathArr[2]
            const fields = getCollectionFields(node?.config?.collection);
            const field = fields.find((f) => f.name == fieldName);
            if (field) {
              return `<%= node[${nodeId}].${fieldName} // ${compile(
                field.uiSchema?.title || field.name,
              )} %>`;
            }
            return `<%= node[${nodeId}].${fieldName}%>`;
          }
        }
      }
    }
  }
  return '';
}

const AvailableVariableTool = (props) => {
  const { t } = useWorkflowTranslation();
  const [operand, setOperand] = useState('');
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
              {props.description} {t('Syntax see')}{' '}
              <a target={'_blank'} href={'https://ejs.co'}>
                ejs
              </a>{' '}
            </div>
          </Col>
        </Row>
      )}
    </VariableTypesContext.Provider>
  );
}
