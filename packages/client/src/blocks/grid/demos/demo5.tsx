import React from 'react';
import { Row, Col } from '../';

export default () => {
  return (
    <div>
      <Row onColResize={(e) => {
        console.log(e.data);
      }}>
        {[1, 2, 3].map((index) => (
          <Col size={1 / 3}>
            <div style={{textAlign: 'center', lineHeight: '60px', background: '#f1f1f1'}}>col {index}</div>
          </Col>
        ))}
      </Row>
    </div>
  );
};
