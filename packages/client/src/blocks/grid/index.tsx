import React from 'react';
import { Row, Col } from 'antd';
import { useBlock } from '../';
import set from 'lodash/set';

export function BlockItem(props: any) {
  const { Component } = useBlock(props);
  if (!Component) {
    return null;
  }
  console.log('BlockItem')
  return <Component {...props} />
}

export interface GridBlockProps {
  blocks: any[];
}

export function GridBlock(props: GridBlockProps) {
  const { blocks = [] } = props;
  const obj = {
    rows: [],
  };
  blocks.forEach(block => {
    const path = ['rows', block['x-row'], block['x-column'], block['x-sort']];
    console.log(path);
    set(obj, path, block);
  });
  console.log({obj})
  return (
    <div>
      {obj.rows.map((cols, rowIndex) => {
        return (
          <Row justify="space-around" align="middle" key={rowIndex}>
            {cols.map((items, colIndex) => {
              return (
                <Col span={24/cols.length} key={colIndex}>
                  {items.map((item, key) => <BlockItem key={key} {...item} />) }
                </Col>
              )
            })}
          </Row>
        );
      })}
    </div>
  );
}

export default GridBlock;
