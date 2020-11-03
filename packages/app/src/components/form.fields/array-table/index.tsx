import React, { useContext } from 'react'
import {
  ISchemaFieldComponentProps,
  SchemaField,
  Schema,
  complieExpression,
  FormExpressionScopeContext
} from '@formily/react-schema-renderer'
import { toArr, isFn, isArr, FormPath } from '@formily/shared'
import { ArrayList, DragListView } from '@formily/react-shared-components'
import { CircleButton } from '../circle-button'
import { TextButton } from '../text-button'
import { Table, Form } from 'antd'
import { FormItemShallowProvider } from '@formily/antd'
import {
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons'
import styled from 'styled-components'

const ArrayComponents = {
  CircleButton,
  TextButton,
  AdditionIcon: () => <PlusOutlined style={{ fontSize: 20 }} />,
  RemoveIcon: () => <DeleteOutlined />,
  MoveDownIcon: () => <DownOutlined />,
  MoveUpIcon: () => <UpOutlined />
}

const DragHandler = styled.span`
  width: 7px;
  display: inline-block;
  height: 14px;
  border: 2px dotted #c5c5c5;
  border-top: 0;
  border-bottom: 0;
  cursor: move;
  margin-bottom: 24px;
`

export const ArrayTable: any = styled(
  (props: ISchemaFieldComponentProps & { className: string }) => {
    const expressionScope = useContext(FormExpressionScopeContext)
    const { value, schema, className, editable, path, mutators } = props
    const {
      renderAddition,
      renderRemove,
      renderMoveDown,
      renderMoveUp,
      renderEmpty,
      renderExtraOperations,
      operationsWidth,
      operations,
      draggable,
      ...componentProps
    } = schema.getExtendsComponentProps() || {}
    const schemaItems = Array.isArray(schema.items)
      ? schema.items[schema.items.length - 1]
      : schema.items
    const onAdd = () => {
      if (schemaItems) {
        mutators.push(schemaItems.getEmptyValue())
      }
    }
    const onMove = (dragIndex, dropIndex) => {
      mutators.move(dragIndex, dropIndex)
    }
    const renderColumns = (items: Schema) => {
      return items.mapProperties((props, key) => {
        const itemProps = {
          ...props.getExtendsItemProps(),
          ...props.getExtendsProps()
        }
        return {
          title: complieExpression(props.title, expressionScope),
          ...itemProps,
          key,
          dataIndex: key,
          render: (value: any, record: any, index: number) => {
            const newPath = FormPath.parse(path).concat(index, key)
            return (
              <FormItemShallowProvider
                key={newPath.toString()}
                label={undefined}
                labelCol={undefined}
                wrapperCol={undefined}
              >
                <SchemaField path={newPath} schema={props} />
              </FormItemShallowProvider>
            )
          }
        }
      })
    }
    // 兼容异步items schema传入
    let columns = []
    if (schema.items) {
      columns = isArr(schema.items)
        ? schema.items.reduce((buf, items) => {
            return buf.concat(renderColumns(items))
          }, [])
        : renderColumns(schema.items)
    }
    if (editable && operations !== false) {
      columns.push({
        ...operations,
        key: 'operations',
        dataIndex: 'operations',
        width: operationsWidth || 200,
        render: (value: any, record: any, index: number) => {
          return (
            <Form.Item>
              <div className="array-item-operator">
                <ArrayList.Remove
                  index={index}
                  onClick={() => mutators.remove(index)}
                />
                <ArrayList.MoveDown
                  index={index}
                  onClick={() => mutators.moveDown(index)}
                />
                <ArrayList.MoveUp
                  index={index}
                  onClick={() => mutators.moveUp(index)}
                />
                {isFn(renderExtraOperations)
                  ? renderExtraOperations(index)
                  : renderExtraOperations}
              </div>
            </Form.Item>
          )
        }
      })
    }
    if (draggable) {
      columns.unshift({
        width: 20,
        key: 'dragHandler',
        render: () => {
          return <DragHandler className="drag-handler" />
        }
      })
    }
    const renderTable = () => {
      return (
        <Table
          {...componentProps}
          rowKey={record => {
            return toArr(value).indexOf(record)
          }}
          pagination={false}
          columns={columns}
          dataSource={toArr(value)}
        ></Table>
      )
    }
    return (
      <div className={className}>
        <ArrayList
          value={value}
          minItems={schema.minItems}
          maxItems={schema.maxItems}
          editable={editable}
          components={ArrayComponents}
          renders={{
            renderAddition,
            renderRemove,
            renderMoveDown,
            renderMoveUp,
            renderEmpty
          }}
        >
          {draggable ? (
            <DragListView
              onDragEnd={onMove}
              nodeSelector="tr.ant-table-row"
              ignoreSelector="tr.ant-table-expanded-row"
            >
              {renderTable()}
            </DragListView>
          ) : (
            renderTable()
          )}
          <ArrayList.Addition>
            {({ children }) => {
              return (
                children && (
                  <div className="array-table-addition" onClick={onAdd}>
                    {children}
                  </div>
                )
              )
            }}
          </ArrayList.Addition>
        </ArrayList>
      </div>
    )
  }
)`
  width: 100%;
  margin-bottom: 10px;
  table {
    margin-bottom: 0 !important;
  }
  .array-table-addition {
    background: #fbfbfb;
    cursor: pointer;
    margin-top: 3px;
    border-radius: 3px;
    .next-btn-text {
      color: #888;
    }
    .next-icon:before {
      width: 16px !important;
      font-size: 16px !important;
      margin-right: 5px;
    }
  }
  .ant-btn {
    color: #888;
  }
  .array-item-operator {
    display: flex;
    button {
      margin-right: 8px;
    }
  }
`

ArrayTable.isFieldComponent = true

export default ArrayTable
