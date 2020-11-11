import React, { Fragment } from 'react'
import {
  ISchemaFieldComponentProps,
  SchemaField
} from '@formily/react-schema-renderer'
import { toArr, isFn, FormPath } from '@formily/shared'
import { ArrayList } from '@formily/react-shared-components'
import { CircleButton } from '../circle-button'
import { TextButton } from '../text-button'
import { Card } from 'antd'
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
  AdditionIcon: () => <PlusOutlined />,
  RemoveIcon: () => <DeleteOutlined />,
  MoveDownIcon: () => <DownOutlined />,
  MoveUpIcon: () => <UpOutlined />
}

export const ArrayCards: any = styled(
  (props: ISchemaFieldComponentProps & { className: string }) => {
    const { value, schema, className, editable, path, mutators } = props
    const {
      renderAddition,
      renderRemove,
      renderMoveDown,
      renderMoveUp,
      renderEmpty,
      renderExtraOperations,
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
          {toArr(value).map((item, index) => {
            return (
              <Card
                {...componentProps}
                size="small"
                className={`card-list-item`}
                key={index}
                title={
                  <span>
                    {index + 1}<span>.</span> {componentProps.title || schema.title}
                  </span>
                }
                extra={
                  <Fragment>
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
                  </Fragment>
                }
              >
                {schemaItems && (
                  <SchemaField
                    path={FormPath.parse(path).concat(index)}
                    schema={schemaItems}
                  />
                )}
              </Card>
            )
          })}
          <ArrayList.Empty>
            {({ children, allowAddition }) => {
              return (
                <Card
                  {...componentProps}
                  size="small"
                  className={`card-list-item card-list-empty ${allowAddition ? 'add-pointer' : ''}`}
                  onClick={allowAddition ? onAdd : undefined}
                >
                  <div className="empty-wrapper">{children}</div>
                </Card>
              )
            }}
          </ArrayList.Empty>
          <ArrayList.Addition>
            {({ children, isEmpty }) => {
              if (!isEmpty) {
                return (
                  <div className="array-cards-addition" onClick={onAdd}>
                    {children}
                  </div>
                )
              }
            }}
          </ArrayList.Addition>
        </ArrayList>
      </div>
    )
  }
)<ISchemaFieldComponentProps>`
  width: 100%;
  .ant-card {
    .ant-card {
      box-shadow: none;
    }
    .ant-card-body {
      padding: 20px 10px 0 10px;
    }
    .array-cards-addition {
      box-shadow: none;
      border: 1px solid #eee;
      transition: all 0.35s ease-in-out;
      &:hover {
        border: 1px solid #ccc;
      }
    }
    .empty-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 10px;
      img {
        height: 85px;
      }
      .ant-btn {
        color: #888;
      }
    }
  }
  .card-list-empty.card-list-item.add-pointer {
    cursor: pointer;
  }

  .array-cards-addition {
    margin-top: 10px;
    margin-bottom: 3px;
    background: #fff;
    display: flex;
    cursor: pointer;
    padding: 5px 0;
    justify-content: center;
    box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.1);
  }
  .card-list-item {
    margin-top: 10px;
    border: 1px solid #eee;
  }
  .card-list-item:first-child {
    margin-top: 0 !important;
  }
  .ant-card-extra {
    display: flex;
    button {
      margin-right: 8px;
    }
  }
`

ArrayCards.isFieldComponent = true

export default ArrayCards
