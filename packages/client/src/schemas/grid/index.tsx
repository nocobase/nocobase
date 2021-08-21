import {
  DndContext,
  DragOverlay,
  useDndContext,
  closestCorners,
  rectIntersection,
  closestCenter,
  useSensors,
  useSensor,
  PointerSensor,
  MouseSensor,
} from '@dnd-kit/core';
import { observer, RecursionField } from '@formily/react';
import React, { useState } from 'react';
import { useContext } from 'react';
import { createContext } from 'react';
import {
  findPropertyByPath,
  getSchemaPath,
  useDesignable,
  useSchemaComponent,
} from '../../components/schema-renderer';
import { Droppable, SortableItem } from '../../components/Sortable';
import { uid } from '@formily/shared';
import cls from 'classnames';
import './style.less';
import {
  createSchema,
  FormilyISchema,
  ISchema,
  removeSchema,
  updateSchema,
} from '..';
import { DesignableBar } from './DesignableBar';

const GridRowContext = createContext<any>(null);
const GridColContext = createContext<any>(null);

export function isGridRowOrCol(schema: ISchema | FormilyISchema) {
  if (!schema) {
    return;
  }
  return ['Grid.Row', 'Grid.Col'].includes(schema?.['x-component']);
}

export const Grid: any = observer((props: any) => {
  const {
    designable,
    root,
    schema,
    refresh,
    deepRemove,
    deepRemoveIfEmpty,
    remove,
    ...methods
  } = useDesignable();
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  const [style, setStyle] = useState({});
  const [active, setActive] = useState(false);
  const [clientWidths, setClientWidths] = useState([0, 0]);
  const { addNewComponent } = props;
  const AddNewComponent = useSchemaComponent(addNewComponent);
  // const sensors = useSensors(useSensor(MouseSensor));
  const rows = Object.values(schema.properties || {}).filter((item) => {
    return !item['x-hidden'];
  });
  const path = getSchemaPath(schema);
  return (
    <div className={cls('nb-grid', { active })}>
      <DndContext
        // autoScroll
        // sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={(event) => {
          setActive(true);
          const el = event?.active?.data?.current?.previewRef
            ?.current as HTMLElement;
          console.log(event, el);
          // setDragOverlayContent(el?.outerHTML);
          // setStyle({ width: el?.clientWidth, height: el?.clientHeight });
          const activeType = event?.active?.data?.current?.type;
          if (activeType === 'col-resize') {
            setDragOverlayContent('');
            const prev = el.previousElementSibling as HTMLDivElement;
            const next = el.nextElementSibling as HTMLDivElement;
            setClientWidths([prev.clientWidth, next.clientWidth]);
          } else {
            setDragOverlayContent('拖拽');
          }
        }}
        onDragCancel={() => {
          setActive(false);
        }}
        onDragMove={(event) => {
          const activeType = event?.active?.data?.current?.type;
          const el = event?.active?.data?.current?.previewRef
            ?.current as HTMLElement;
          if (activeType === 'col-resize') {
            const prev = el.previousElementSibling as HTMLDivElement;
            const next = el.nextElementSibling as HTMLDivElement;
            prev.style.width = `calc(${clientWidths[0]}px + ${event.delta.x}px)`;
            next.style.width = `calc(${clientWidths[1]}px - ${event.delta.x}px)`;
            return;
          }
        }}
        onDragOver={(event) => {
          const activeType = event?.active?.data?.current?.type;
          console.log({ event });
          if (activeType === 'col-resize') {
            return;
          }
        }}
        onDragEnd={async (event) => {
          setActive(false);
          const activeType = event?.active?.data?.current?.type;
          const sourcePath = event?.active?.data?.current?.path;
          const targetPath = event?.over?.data?.current?.path;
          const method = event?.over?.data?.current?.method;
          const type = event?.over?.data?.current?.type;
          console.log({ event, sourcePath, targetPath });
          if (activeType === 'col-resize') {
            const parentPath = event?.active?.data?.current?.parentPath;
            const el = event?.active?.data?.current?.previewRef
              ?.current as HTMLElement;
            const els = el.parentElement.querySelectorAll(
              ':scope > .nb-grid-col',
            );
            const size = [];
            const gap = el.clientWidth;
            els.forEach((el: HTMLDivElement) => {
              // const w = (100 * el.clientWidth) / el.parentElement.clientWidth;
              const w2 =
                (100 * (el.clientWidth + gap + gap / els.length)) /
                el.parentElement.clientWidth;
              size.push(w2);
              // el.style.width = `${w}%`;
            });
            const parent = findPropertyByPath(root, parentPath);
            parent['x-component-props'] = parent['x-component-props'] || {};
            parent['x-component-props']['colsize'] = size;
            await updateSchema({
              key: parent['key'],
              'x-component-props': {
                colsize: size,
              },
            });
            return;
          }
          if (!sourcePath || !targetPath) {
            return;
          }
          if (sourcePath === targetPath) {
            return;
          }
          let fn = methods[method];
          if (!fn && type === 'block') {
            fn = methods.insertAfter;
          }
          console.log({ event, sourcePath, targetPath, method, type });
          if (!fn) {
            return;
          }
          const sourceSchema = findPropertyByPath(root, sourcePath);
          if (!sourceSchema) {
            return;
          }
          if (!type) {
            return;
          }
          let data;
          if (['col-divider', 'col-resize'].includes(type)) {
            // if (sourceSchema?.parent?.['x-component'] === 'Grid.Col') {
            //   // console.log('datadata', sourcePath, targetPath);
            //   if (
            //     sourcePath.join('.').startsWith(targetPath.join('.')) &&
            //     Object.keys(sourceSchema?.parent?.properties).length < 2
            //   ) {
            //     return;
            //   }
            // }
            data = {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                [sourceSchema.name]: sourceSchema.toJSON(),
              },
            };
          } else if (['block', 'col'].includes(type)) {
            data = sourceSchema.toJSON();
          } else if (['row-divider', 'row'].includes(type)) {
            data = {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [sourceSchema.name]: sourceSchema.toJSON(),
                  },
                },
              },
            };
          }
          if (data) {
            console.log('datadata', data, type, method);
            remove(sourcePath);
            const ppath = [...sourcePath];
            ppath.pop();
            const s = fn(data, targetPath);
            const removed = deepRemoveIfEmpty(ppath);
            const last = removed.pop();
            if (['block', 'col'].includes(type)) {
              await updateSchema(s);
            } else {
              await createSchema(s);
            }
            if (isGridRowOrCol(last)) {
              await removeSchema(last);
            }
          }
        }}
      >
        <DragOverlay
          dropAnimation={{
            duration: 20,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
          // dropAnimation={null}
          // style={{ whiteSpace: 'nowrap' }}
          style={{
            width: 40,
            whiteSpace: 'nowrap',
            // ...style,
            // pointerEvents: 'none',
          }}
        >
          <div
            className={'nb-grid-drag-overlay'}
            style={{
              ...style,
            }}
            dangerouslySetInnerHTML={{ __html: dragOverlayContent }}
          />
        </DragOverlay>
        <Droppable
          id={`${schema.name}-row-divider`}
          className={'nb-grid-row-divider'}
          data={{
            type: 'row-divider',
            method: 'prepend',
            path,
          }}
        />
        {rows.map((property, index) => {
          return (
            <>
              {index > 0 && (
                <Droppable
                  id={`${schema.name}-row-divider-${index}`}
                  className={'nb-grid-row-divider'}
                  data={{
                    type: 'row-divider',
                    method: 'insertBefore',
                    path: [...path, property.name],
                  }}
                />
              )}
              <RecursionField name={property.name} schema={property} />
            </>
          );
        })}
        <Droppable
          id={`${schema.name}-row-divider-last`}
          className={'nb-grid-row-divider'}
          data={{
            type: 'row-divider',
            method: 'appendChild',
            path,
          }}
        />
      </DndContext>
      {designable && AddNewComponent && <AddNewComponent />}
    </div>
  );
});

Grid.Row = observer((props: any) => {
  const { designable, schema } = useDesignable();
  const columns = Object.values(schema.properties || {}).filter((item) => {
    return !item['x-hidden'];
  });
  const columnCount = columns.length;
  const path = getSchemaPath(schema);
  let size = schema['x-component-props']?.['colsize'] || [];
  if (size?.length !== columnCount) {
    size = [];
  }
  return (
    <GridRowContext.Provider value={{ columnCount }}>
      <Droppable
        id={schema.name}
        className={'nb-grid-row'}
        data={{
          type: 'row',
          method: 'appendChild',
          path,
        }}
      >
        <Droppable
          id={`${schema.name}-first`}
          className={'nb-grid-col-divider'}
          data={{
            type: 'col-divider',
            method: 'prepend',
            path: [...path],
          }}
        />
        {columns.map((property, index) => {
          return (
            <>
              {index > 0 && (
                <SortableItem
                  draggable
                  id={`${schema.name}-${index}`}
                  data={{
                    type: 'col-resize',
                    method: 'insertBefore',
                    parentPath: [...path],
                    path: [...path, property.name],
                  }}
                  disabled={!designable}
                  className={cls('nb-grid-col-divider', {
                    resizable: designable,
                  })}
                />
              )}
              <GridColContext.Provider value={{ index, width: size[index] }}>
                <RecursionField name={property.name} schema={property} />
              </GridColContext.Provider>
            </>
          );
        })}
        <Droppable
          id={`${schema.name}-last`}
          className={'nb-grid-col-divider'}
          data={{
            type: 'col-divider',
            method: 'appendChild',
            path: [...path],
          }}
        />
      </Droppable>
    </GridRowContext.Provider>
  );
});

Grid.Col = observer((props: any) => {
  const { schema, designable, DesignableBar } = useDesignable();
  // const { width } = props;
  const { columnCount } = useContext(GridRowContext);
  const { width } = useContext(GridColContext);
  return (
    <Droppable
      id={schema.name}
      className={'nb-grid-col'}
      style={{
        width: `calc(${
          width || 100 / columnCount
        }% - 24px - 24px / ${columnCount})`,
      }}
      data={{
        type: 'col',
        method: 'appendChild',
        path: getSchemaPath(schema),
      }}
    >
      {/* <Droppable
        id={`${schema.name}-divider`}
        className={'nb-grid-row-divider'}
      /> */}
      {props.children}
      {/* <Grid.Col.DesignableBar /> */}
    </Droppable>
  );
});

Grid.Col.DesignableBar = DesignableBar;
