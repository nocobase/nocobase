import '@asseinfo/react-kanban/dist/styles.css';
import { Button } from 'antd';
import React, { useState } from 'react';
import Board from './Board';
import { addCard, moveCard, removeCard } from './helpers';

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        {
          id: 1,
          title: 'Card title 1',
          description: 'Card content',
        },
        {
          id: 2,
          title: 'Card title 2',
          description: 'Card content',
        },
        {
          id: 3,
          title: 'Card title 3',
          description: 'Card content',
        },
      ],
    },
    {
      id: 2,
      title: 'Doing',
      cards: [
        {
          id: 9,
          title: 'Card title 9',
          description: 'Card content',
        },
      ],
    },
    {
      id: 3,
      title: 'Q&A',
      cards: [
        {
          id: 10,
          title: 'Card title 10',
          description: 'Card content',
        },
        {
          id: 11,
          title: 'Card title 11',
          description: 'Card content',
        },
      ],
    },
    {
      id: 4,
      title: 'Production',
      cards: [
        {
          id: 12,
          title: 'Card title 12',
          description: 'Card content',
        },
        {
          id: 13,
          title: 'Card title 13',
          description: 'Card content',
        },
      ],
    },
  ],
};

function UncontrolledBoard() {
  const [controlledBoard, setBoard] = useState(board);
  function handleCardMove(card, source, destination) {
    const updatedBoard = moveCard(controlledBoard, source, destination);
    setBoard(updatedBoard);
  }
  function handleCardRemove(card, column) {
    const updatedBoard = removeCard(controlledBoard, column, card);
    setBoard(updatedBoard);
  }
  return (
    <Board
      disableColumnDrag
      allowRemoveCard
      allowAddCard={{ on: 'bottom' }}
      onLaneRemove={console.log}
      onCardRemove={handleCardRemove}
      onCardDragEnd={handleCardMove}
      onLaneRename={console.log}
      cardAdderPosition={'bottom'}
      onNewCardConfirm={(draftCard) => draftCard}
      onCardNew={console.log}
      renderCardAdder={({ column }) => {
        return (
          <Button
            block
            type={'text'}
            onClick={() => {
              const updatedBoard = addCard(controlledBoard, column, {
                id: new Date().getTime(),
                title: 'Card title ' + new Date().getTime(),
                description: 'Card content',
              });
              setBoard(updatedBoard);
            }}
          >
            添加卡片
          </Button>
        );
      }}
    >
      {controlledBoard}
    </Board>
  );
}

export function Kanban() {
  return (
    <>
      <UncontrolledBoard />
    </>
  );
}
