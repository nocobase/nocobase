/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { css } from '@emotion/css';
import Column from './Column';
import ColumnAdder from './ColumnAdder';
import DefaultCard from './DefaultCard';
import DefaultColumnHeader from './DefaultColumnHeader';
import * as helpers from './helpers';
import { addCard, addColumn, changeColumn, moveCard, moveColumn, removeCard, removeColumn } from './helpers';
import {
  getCard,
  getCoordinates,
  isAColumnMove,
  isMovingACardToAnotherPosition,
  isMovingAColumnToAnotherPosition,
} from './services';
import { useStyles } from './style';
import { partialRight, when } from './utils';
import withDroppable from './withDroppable';
import { useKanbanBlockHeight } from './hook';

const Columns = forwardRef((props, ref: any) => {
  return <div ref={ref} style={{ whiteSpace: 'nowrap', overflowY: 'clip' }} {...props} />;
});
Columns.displayName = 'Columns';

const DroppableBoard = withDroppable(Columns);

const Board: any = (props) => {
  const { columnWidth } = props;
  const height = useKanbanBlockHeight();
  const { styles } = useStyles({ columnWidth });

  return (
    <div className={styles.nbBord}>
      <div
        className={css`
          .react-kanban-card-skeleton {
            height: ${height ? height + 'px' : '70vh'};
          }
        `}
      >
        {props.initialBoard ? <UncontrolledBoard {...props} /> : <ControlledBoard {...props} />}
      </div>
    </div>
  );
};

Object.keys(helpers).forEach((key) => {
  Board[key] = helpers[key];
});

function UncontrolledBoard({
  initialBoard,
  onCardDragEnd,
  onColumnDragEnd,
  allowAddColumn,
  cardAdderPosition,
  renderCardAdder,
  renderColumnAdder,
  onNewColumnConfirm,
  onColumnRemove,
  renderColumnHeader,
  allowRemoveColumn,
  allowRenameColumn,
  onColumnRename,
  onCardNew,
  renderCard,
  allowRemoveCard,
  onCardRemove,
  onColumnNew,
  disableCardDrag,
  disableColumnDrag,
  allowAddCard,
  onNewCardConfirm,
}) {
  const [board, setBoard] = useState(initialBoard);
  const handleOnCardDragEnd = partialRight(handleOnDragEnd, { moveCallback: moveCard, notifyCallback: onCardDragEnd });
  const handleOnColumnDragEnd = partialRight(handleOnDragEnd, {
    moveCallback: moveColumn,
    notifyCallback: onColumnDragEnd,
  });

  function handleOnDragEnd({ source, destination, subject }, { moveCallback, notifyCallback }) {
    const reorderedBoard = moveCallback(board, source, destination);
    when(notifyCallback)((callback) => callback(reorderedBoard, subject, source, destination));
    setBoard(reorderedBoard);
  }

  async function handleColumnAdd(newColumn) {
    const column = renderColumnAdder ? newColumn : await onNewColumnConfirm(newColumn);
    const boardWithNewColumn = addColumn(board, column);
    onColumnNew(boardWithNewColumn, column);
    setBoard(boardWithNewColumn);
  }

  function handleColumnRemove(column) {
    const filteredBoard = removeColumn(board, column);
    onColumnRemove(filteredBoard, column);
    setBoard(filteredBoard);
  }

  function handleColumnRename(column, title) {
    const boardWithRenamedColumn = changeColumn(board, column, { title });
    onColumnRename(boardWithRenamedColumn, { ...column, title });
    setBoard(boardWithRenamedColumn);
  }

  function handleCardAdd(column, card, options = {}) {
    const boardWithNewCard = addCard(board, column, card, options);

    onCardNew(
      boardWithNewCard,
      boardWithNewCard.columns.find(({ id }) => id === column.id),
      card,
    );
    setBoard(boardWithNewCard);
  }

  async function handleDraftCardAdd(column, card, options = {}) {
    const newCard = await onNewCardConfirm(card);
    handleCardAdd(column, newCard, options);
  }

  function handleCardRemove(column, card) {
    const boardWithoutCard = removeCard(board, column, card);
    onCardRemove(
      boardWithoutCard,
      boardWithoutCard.columns.find(({ id }) => id === column.id),
      card,
    );
    setBoard(boardWithoutCard);
  }

  return (
    <BoardContainer
      cardAdderPosition={cardAdderPosition}
      onCardDragEnd={handleOnCardDragEnd}
      onColumnDragEnd={handleOnColumnDragEnd}
      renderCardAdder={renderCardAdder}
      renderColumnAdder={() => {
        if (!allowAddColumn) return null;
        if (renderColumnAdder) return renderColumnAdder({ addColumn: handleColumnAdd });
        if (!onNewColumnConfirm) return null;
        return <ColumnAdder onConfirm={(title) => handleColumnAdd({ title, cards: [] })} />;
      }}
      {...(renderColumnHeader && {
        renderColumnHeader: (column) =>
          renderColumnHeader(column, {
            removeColumn: handleColumnRemove.bind(null, column),
            renameColumn: handleColumnRename.bind(null, column),
            addCard: handleCardAdd.bind(null, column),
          }),
      })}
      renderCard={(column, card, dragging) => {
        if (renderCard) return renderCard(card, { removeCard: handleCardRemove.bind(null, column, card), dragging });
        return (
          <DefaultCard
            dragging={dragging}
            allowRemoveCard={allowRemoveCard}
            onCardRemove={(card) => handleCardRemove(column, card)}
          >
            {card}
          </DefaultCard>
        );
      }}
      allowRemoveColumn={allowRemoveColumn}
      onColumnRemove={handleColumnRemove}
      allowRenameColumn={allowRenameColumn}
      onColumnRename={handleColumnRename}
      disableColumnDrag={disableColumnDrag}
      disableCardDrag={disableCardDrag}
      onCardNew={(column, card) => handleDraftCardAdd(column, card, allowAddCard)}
      allowAddCard={allowAddCard && onNewCardConfirm}
    >
      {board}
    </BoardContainer>
  );
}

function ControlledBoard({
  children: board,
  onCardDragEnd,
  onColumnDragEnd,
  allowAddColumn,
  renderCardAdder,
  renderColumnAdder,
  onNewColumnConfirm,
  onColumnRemove,
  renderColumnHeader,
  allowRemoveColumn,
  allowRenameColumn,
  onColumnRename,
  renderCard,
  allowAddCard,
  allowRemoveCard,
  onCardRemove,
  disableCardDrag,
  disableColumnDrag,
  cardAdderPosition,
}) {
  const handleOnCardDragEnd = partialRight(handleOnDragEnd, { notifyCallback: onCardDragEnd });
  const handleOnColumnDragEnd = partialRight(handleOnDragEnd, { notifyCallback: onColumnDragEnd });

  function handleOnDragEnd({ source, destination, subject }, { notifyCallback }) {
    when(notifyCallback)((callback) => callback(subject, source, destination));
  }

  return (
    <BoardContainer
      cardAdderPosition={cardAdderPosition}
      onCardDragEnd={handleOnCardDragEnd}
      onColumnDragEnd={handleOnColumnDragEnd}
      renderCardAdder={renderCardAdder}
      renderColumnAdder={() => {
        if (!allowAddColumn) return null;
        if (renderColumnAdder) return renderColumnAdder();
        if (!onNewColumnConfirm) return null;
        return <ColumnAdder onConfirm={(title) => onNewColumnConfirm({ title, cards: [] })} />;
      }}
      {...(renderColumnHeader && { renderColumnHeader: renderColumnHeader })}
      renderCard={(column, card, dragging) => {
        if (renderCard) return renderCard(card, { column, dragging });
        return (
          <DefaultCard
            dragging={dragging}
            allowRemoveCard={allowRemoveCard}
            onCardRemove={(card) => onCardRemove(card, column)}
          >
            {card}
          </DefaultCard>
        );
      }}
      allowAddCard={allowAddCard}
      allowRemoveColumn={allowRemoveColumn}
      onColumnRemove={onColumnRemove}
      allowRenameColumn={allowRenameColumn}
      onColumnRename={onColumnRename}
      disableColumnDrag={disableColumnDrag}
      disableCardDrag={disableCardDrag}
    >
      {board}
    </BoardContainer>
  );
}

function BoardContainer(props) {
  const {
    children: board,
    renderCard,
    disableColumnDrag,
    disableCardDrag,
    cardAdderPosition,
    renderCardAdder,
    renderColumnHeader,
    renderColumnAdder,
    allowRemoveColumn,
    onColumnRemove,
    allowRenameColumn,
    onColumnRename,
    onColumnDragEnd,
    onCardDragEnd,
    onCardNew,
    allowAddCard,
  } = props;
  function handleOnDragEnd(event) {
    const coordinates = getCoordinates(event, board);
    if (!coordinates.source) return;

    isAColumnMove(event.type)
      ? isMovingAColumnToAnotherPosition(coordinates) &&
        onColumnDragEnd({ ...coordinates, subject: board.columns?.[coordinates.source.fromPosition] })
      : isMovingACardToAnotherPosition(coordinates) &&
        onCardDragEnd({ ...coordinates, subject: getCard(board, coordinates.source) });
  }
  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <div style={{ overflowY: 'hidden', display: 'flex', alignItems: 'flex-start', height: '100%' }}>
        <DroppableBoard droppableId="board-droppable" direction="horizontal" type="BOARD" style={{ height: '200px' }}>
          {board.columns?.map((column, index) => (
            <Column
              key={column.id}
              index={column?.index ?? index}
              renderCard={renderCard}
              renderCardAdder={renderCardAdder}
              renderColumnHeader={(column) =>
                renderColumnHeader ? (
                  renderColumnHeader(column)
                ) : (
                  <DefaultColumnHeader
                    allowRemoveColumn={allowRemoveColumn}
                    onColumnRemove={onColumnRemove}
                    allowRenameColumn={allowRenameColumn}
                    onColumnRename={onColumnRename}
                  >
                    {column}
                  </DefaultColumnHeader>
                )
              }
              cardAdderPosition={cardAdderPosition}
              disableColumnDrag={disableColumnDrag}
              disableCardDrag={disableCardDrag}
              onCardNew={onCardNew}
              allowAddCard={allowAddCard}
            >
              {column}
            </Column>
          ))}
        </DroppableBoard>
        {renderColumnAdder()}
      </div>
    </DragDropContext>
  );
}

export default Board;
