import React, { useState } from 'react';
import ColumnForm from './ColumnForm';

function ColumnAdder({ onConfirm }) {
  const [isAddingColumn, setAddingColumn] = useState(false);

  function confirmColumn(title) {
    onConfirm(title);
    setAddingColumn(false);
  }

  return isAddingColumn ? (
    <ColumnForm onConfirm={confirmColumn} onCancel={() => setAddingColumn(false)} />
  ) : (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '230px' }}
      className="react-kanban-column-adder-button"
      onClick={() => setAddingColumn(true)}
      role="button"
    >
      ➕
    </div>
  );
}

export default ColumnAdder;
