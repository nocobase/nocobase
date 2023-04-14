function getCoordinates(event, board) {
  if (event.destination === null) return {}

  const columnSource = { fromPosition: event.source.index }
  const columnDestination = { toPosition: event.destination.index }

  if (isAColumnMove(event.type)) {
    return { source: columnSource, destination: columnDestination }
  }

  return {
    source: { ...columnSource, fromColumnId: getColumn(board, event.source.droppableId).value },
    destination: { ...columnDestination, toColumnId: getColumn(board, event.destination.droppableId).value },
  }
}

function isAColumnMove(type) {
  return type === 'BOARD'
}

function getCard(board, sourceCoordinate) {
  const column = board.columns.find((column) => column.value === sourceCoordinate.fromColumnId)
  console.log(column)
  return column.cards[sourceCoordinate.fromPosition]
}

function getColumn(board, droppableId) {
  console.log(board,droppableId)
  return board.columns.find(({ value }) => value === droppableId)
}

function isMovingAColumnToAnotherPosition(coordinates) {
  return coordinates.source.fromPosition !== coordinates.destination.toPosition
}

function isMovingACardToAnotherPosition(coordinates) {
  return !(
    coordinates.source.fromPosition === coordinates.destination.toPosition &&
    coordinates.source.fromColumnId === coordinates.destination.toColumnId
  )
}

export { getCard, getCoordinates, isAColumnMove, isMovingAColumnToAnotherPosition, isMovingACardToAnotherPosition }
