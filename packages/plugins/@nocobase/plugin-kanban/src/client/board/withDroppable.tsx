import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

function withDroppable(Component) {
  const res = function WrapperComponent({ children, ...droppableProps }) {
    return (
      <Droppable {...droppableProps}>
        {(provided) => (
          <Component ref={provided.innerRef} {...provided.droppableProps}>
            {children}
            {provided.placeholder}
          </Component>
        )}
      </Droppable>
    );
  };
  res.displayName = `withDroppable(${Component.displayName || Component.name})`;
  return res;
}

export default withDroppable;
