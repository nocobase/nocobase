import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

function withDroppable(Component) {
  return function WrapperComponent({ children, ...droppableProps }) {
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
}

export default withDroppable;
