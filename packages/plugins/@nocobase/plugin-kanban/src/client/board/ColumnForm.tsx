import React, { createRef } from 'react';
import { when } from './utils';

function ColumnForm({ onConfirm, onCancel }) {
  // FIXME use hook
  const inputColumnTitle = createRef<any>();

  function addColumn(event) {
    event.preventDefault();

    when(inputColumnTitle.current.value)(onConfirm);
  }

  return (
    <div className="react-kanban-column" style={{ minWidth: '230px' }}>
      <form style={{ display: 'flex', justifyContent: 'space-between' }} onSubmit={addColumn}>
        <input type="text" ref={inputColumnTitle} autoFocus />
        <button type="submit">Add</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default ColumnForm;
