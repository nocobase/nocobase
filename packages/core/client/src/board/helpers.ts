import {
  addInArrayAtPosition,
  changeElementOfPositionInArray,
  removeFromArrayAtPosition,
  replaceElementOfArray
} from './utils';

function reorderCardsOnColumn(column, reorderCards) {
  return { ...column, cards: reorderCards(column.cards) };
}

function moveColumn(board, { fromPosition }, { toPosition }) {
  return { ...board, columns: changeElementOfPositionInArray(board.columns, fromPosition, toPosition) };
}

function moveCard(board, { fromPosition, fromColumnId }, { toPosition, toColumnId }) {
  const sourceColumn = board.columns.find((column) => column.value === fromColumnId);
  const destinationColumn = board.columns.find((column) => column.value === toColumnId);

  const reorderColumnsOnBoard = (reorderColumnsMapper) => ({
    ...board,
    columns: board.columns.map(reorderColumnsMapper),
  });
  const reorderCardsOnSourceColumn = reorderCardsOnColumn.bind(null, sourceColumn);
  const reorderCardsOnDestinationColumn = reorderCardsOnColumn.bind(null, destinationColumn);

  if (sourceColumn.value === destinationColumn.value) {
    const reorderedCardsOnColumn = reorderCardsOnSourceColumn((cards) => {
      return changeElementOfPositionInArray(cards, fromPosition, toPosition);
    });
    return reorderColumnsOnBoard((column) => (column.value === sourceColumn.value ? reorderedCardsOnColumn : column));
  } else {
    const reorderedCardsOnSourceColumn = reorderCardsOnSourceColumn((cards) => {
      return removeFromArrayAtPosition(cards, fromPosition);
    });
    const reorderedCardsOnDestinationColumn = reorderCardsOnDestinationColumn((cards) => {
      return addInArrayAtPosition(cards, sourceColumn.cards[fromPosition], toPosition);
    });
    return reorderColumnsOnBoard((column) => {
      if (column.value === sourceColumn.value) return reorderedCardsOnSourceColumn;
      if (column.value === destinationColumn.value) return reorderedCardsOnDestinationColumn;
      return column;
    });
  }
}

function addColumn(board, column) {
  return { ...board, columns: addInArrayAtPosition(board.columns, column, board.columns.length) };
}

function removeColumn(board, column) {
  return { ...board, columns: board.columns.filter(({ value }) => value !== column.value) };
}

function changeColumn(board, column, newColumn) {
  const changedColumns = replaceElementOfArray(board.columns)({
    when: ({ value }) => value === column.value,
    for: (value) => ({ ...value, ...newColumn }),
  });
  return { ...board, columns: changedColumns };
}

function addCard(board, inColumn, card, { on }: any = {}) {
  const columnToAdd = board.columns.find(({ value }) => value === inColumn.value);
  const cards = addInArrayAtPosition(columnToAdd.cards, card, on === 'top' ? 0 : columnToAdd.cards.length);
  const columns = replaceElementOfArray(board.columns)({
    when: ({ value }) => inColumn.value === value,
    for: (value) => ({ ...value, cards }),
  });
  return { ...board, columns };
}

function removeCard(board, fromColumn, card) {
  const columnToRemove = board.columns.find(({ value }) => value === fromColumn.value);
  const filteredCards = columnToRemove.cards.filter(({ value }) => card.value !== value);
  const columnWithoutCard = { ...columnToRemove, cards: filteredCards };
  const filteredColumns = board.columns.map((column) => (fromColumn.value === column.value ? columnWithoutCard : column));
  return { ...board, columns: filteredColumns };
}

function changeCard(board, cardId, newCard) {
  const changedCards = (cards) =>
    replaceElementOfArray(cards)({
      when: ({ value }) => value === cardId,
      for: (card) => ({ ...card, ...newCard }),
    });

  return { ...board, columns: board.columns.map((column) => ({ ...column, cards: changedCards(column.cards) })) };
}

export { moveColumn, moveCard, addColumn, removeColumn, changeColumn, addCard, removeCard, changeCard };
