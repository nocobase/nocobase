import * as renders from './renders';

function getInterfaceRender(name: string): Function {
  return renders[name] || renders._;
}

function renderHeader(params, ctx) {
  const { columns, fields, headers = [], rowIndex = 0 } = params;

  const { colIndex = 0 } = params;

  if (!headers[rowIndex]) {
    headers.push([]);
  }
  const row = headers[rowIndex];
  fields.forEach((field, i) => {
    const nextColIndex = colIndex + i;
    row.push({
      column: columns[i],
      field,
      rowIndex,
      colIndex: nextColIndex,
    });
    // if (field.interface === 'subTable') {
    //   const subTable = ctx.db.getTable(field.target);
    //   const subFields = subTable.getOptions().fields.filter((field) => Boolean(field.__index));
    //   renderHeader(
    //     {
    //       fields: subFields,
    //       headers,
    //       rowIndex: rowIndex + 1,
    //       colIndex: nextColIndex,
    //     },
    //     ctx,
    //   );
    //   colIndex += subFields.length;
    // }
  });

  Object.assign(params, { headers });
}

async function renderRows({ columns, fields, data }, ctx) {
  return await data.reduce(async (preResult, row) => {
    const result = await preResult;
    const thisRow = [];
    const rowIndex = 0;
    let colOffset = 0;
    for (let i = 0, iLen = fields.length; i < iLen; i++) {
      const field = fields[i];

      if (!thisRow[rowIndex]) {
        thisRow.push([]);
      }
      const cells = thisRow[rowIndex];
      if (field.options.interface !== 'subTable') {
        const render = getInterfaceRender(field.options.interface);
        const value = await render(field, row, ctx, columns[i]);
        cells.push({
          value,
          rowIndex: result.length + rowIndex,
          colIndex: i + colOffset,
        });
      } else {
        const subTable = ctx.db.getTable(field.target);
        const subFields = subTable.getOptions().fields.filter((item) => Boolean(item.__index));
        //TODO: must provide sub-table columns
        const subTableColumns = [];
        const subRows = await renderRows(
          { columns: subTableColumns, fields: subFields, data: row.get(field.name) || [] },
          ctx,
        );

        // const { rows: subRowGroups } = subTableRows;
        subRows.forEach((cells, j) => {
          const subRowIndex = rowIndex + j;
          if (!thisRow[subRowIndex]) {
            thisRow.push([]);
          }
          const subCells = thisRow[subRowIndex];
          subCells.push(
            ...cells.map((cell) => ({
              ...cell,
              rowIndex: result.length + subRowIndex,
              colIndex: cell.colIndex + i,
            })),
          );
        });
        colOffset += subFields.length;
      }
    }
    thisRow.forEach((cells) => {
      cells.forEach((cell) => {
        const relRowIndex = cell.rowIndex - result.length;
        Object.assign(cell, {
          rowSpan:
            relRowIndex >= thisRow.length - 1 ||
            thisRow[relRowIndex + 1].find((item) => item.colIndex === cell.colIndex)
              ? 1
              : thisRow.length - relRowIndex,
        });
      });
    });

    return result.concat(thisRow);
  }, Promise.resolve([]));
}

export default async function ({ columns, fields, data }, ctx) {
  const headers = [];
  renderHeader({ columns, fields, headers }, ctx);
  const ranges = [];
  // 计算全表最大的列索引（由于无论如何最大列都是单个单元格，所以等价于长度）
  const maxColIndex = Math.max(...headers.map((row) => row[row.length - 1].colIndex));
  // 遍历所有单元格，计算需要合并的坐标范围
  headers.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      // 跨行合并的行数为
      cell.rowSpan =
        cell.rowIndex >= headers.length - 1 ||
        headers[cell.rowIndex + 1].find((item) => item.colIndex === cell.colIndex)
          ? 1
          : headers.length - cell.rowIndex;

      const nextCell = headers
        .slice(0, rowIndex + 1)
        .map((r) => r.find((item) => item.colIndex > cell.colIndex))
        .filter((c) => Boolean(c))
        .reduce((min, c) => (min && Math.min(min.colIndex, c.colIndex) === min.colIndex ? min : c), null);
      cell.colSpan = nextCell ? nextCell.colIndex - cell.colIndex : maxColIndex - cell.colIndex + 1;

      if (cell.rowSpan > 1 || cell.colSpan > 1) {
        ranges.push({
          s: { c: cell.colIndex, r: cell.rowIndex },
          e: { c: cell.colIndex + cell.colSpan - 1, r: cell.rowIndex + cell.rowSpan - 1 },
        });
      }
    });
  });

  const rows = (await renderRows({ columns, fields, data }, ctx)).map((row) => {
    const cells = Array(maxColIndex).fill(null);
    row.forEach((cell) => {
      cells.splice(cell.colIndex, 1, cell.value);
      if (cell.rowSpan > 1) {
        ranges.push({
          s: { c: cell.colIndex, r: cell.rowIndex + headers.length },
          e: { c: cell.colIndex, r: cell.rowIndex + cell.rowSpan - 1 + headers.length },
        });
      }
    });
    return cells;
  });

  return {
    rows: [
      ...headers.map((row) => {
        // 补齐无数据单元格，以供合并
        const cells = Array(maxColIndex).fill(null);
        row.forEach((cell) =>
          cells.splice(
            cell.colIndex,
            1,
            cell.column.title ?? cell.column.defaultTitle ?? cell.column.dataIndex[cell.column.dataIndex.length - 1],
          ),
        );
        return cells;
      }),
      ...rows,
    ],
    ranges,
  };
}
