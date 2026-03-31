import React from 'react';

interface GridProps {
  items: string[][][]; // 三维数组：行-列-区块
  itemRender: (uid: string) => React.ReactNode;
}

function Grid({ items, itemRender }: GridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'flex', gap: 8 }}>
          {row.map((col, colIdx) => (
            <div
              key={colIdx}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                border: '1px solid #eee',
                padding: 8,
              }}
            >
              {col.map((uid, blockIdx) => (
                <div style={{ width: '100%' }} key={blockIdx}>
                  {itemRender(uid)}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const items = [
  [
    // 第一行
    ['A', 'B'], // 第一行的第一列两个区块
    ['C'], // 第一行的第二列一个区块
  ],
  [
    // 第二行
    ['D'], // 第二行的第一列一个区块
    ['E', 'F'], // 第二行的第二列两个区块
  ],
];

function GridDemo() {
  return (
    <div>
      <Grid items={items} itemRender={(uid) => <div style={{ background: '#f5f5f5', padding: 4 }}>{uid}</div>} />
    </div>
  );
}

export default GridDemo;
