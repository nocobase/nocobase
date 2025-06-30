/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Edge,
  Node,
} from 'reactflow';
import ELK from 'elkjs/lib/elk.bundled.js';
import '@xyflow/react/dist/style.css';
import { CollectionNode } from './CollectionNode';
import { css } from '@emotion/css';
import { useGlobalTheme } from '@nocobase/client';

const elk = new ELK();

const nodeTypes = {
  collection: CollectionNode,
};

const layoutElements = async (nodes: Node[], edges: Edge[]) => {
  const isHorizontal = !edges.length;
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': edges.length ? 'org.eclipse.elk.layered' : 'org.eclipse.elk.box',
      // 'elk.spacing.nodeNode': '100',
      // 'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      // 'elk.expandNodes': true,
    },
    children: nodes.map((node) => ({
      ...node,
      // Adjust the target and source handle positions based on the layout
      // direction.
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',

      // Hardcode a width and height for elk to use when layouting.
      width: 320,
      height: 50 * (node.data.fields.length + 1),
    })),
    edges: edges,
  };

  return (
    elk
      // @ts-ignore
      .layout(graph)
      .then((layoutedGraph) => ({
        nodes: layoutedGraph.children.map((node) => ({
          ...node,
          // React Flow expects a position property on the node instead of `x`
          // and `y` fields.
          position: { x: node.x, y: node.y },
        })),

        edges: layoutedGraph.edges,
      }))
      .catch(console.error)
  );
};

const getDiagramData = (collections: any[]) => {
  const collectionMap = new Map(collections.map((col) => [col.name, col]));

  for (const collection of collections) {
    if (collection.autoGenId) {
      collection.fields.unshift({
        name: 'id',
        interface: 'id',
        type: 'bigInt',
        title: 'ID',
        primaryKey: true,
        autoIncrement: true,
      });
    }
  }

  const nodes = collections.map((collection) => ({
    id: collection.name,
    type: 'collection',
    position: { x: 0, y: 0 },
    data: {
      title: collection.title,
      name: collection.name,
      fields: [...collection.fields],
    },
  }));

  const edges: any[] = [];

  // for (const collection of collections) {
  //   for (const field of collection.fields) {
  //     const { type, target, name: fieldName, foreignKey, targetKey, through } = field;
  //
  //     if (!target || !collectionMap.has(target)) continue;
  //     const targetCollection = collectionMap.get(target);
  //     const targetFields = targetCollection.fields || [];
  //     const targetFieldExists = (key: string) => targetFields.some((f: any) => f.name === key);
  //
  //     const tk = targetKey || 'id';
  //     const fk = foreignKey || 'id';
  //
  //     if (type === 'belongsTo' && target === collection.name) {
  //       if (!targetFieldExists(tk)) continue;
  //
  //       edges.push({
  //         id: `${collection.name}-${fieldName}-to-self`,
  //         source: collection.name,
  //         sourceHandle: `${collection.name}-${fieldName}-source-right`,
  //         target: collection.name,
  //         targetHandle: `${collection.name}-${tk}-target-right`,
  //         type: 'smoothstep',
  //         animated: true,
  //       });
  //       continue;
  //     }
  //
  //     if (type === 'belongsTo') {
  //       if (!targetFieldExists(tk)) continue;
  //
  //       edges.push({
  //         id: `${collection.name}-${fieldName}-to-${tk}`,
  //         source: collection.name,
  //         sourceHandle: `${collection.name}-${fieldName}-source-right`,
  //         target,
  //         targetHandle: `${target}-${tk}-target-left`,
  //         // type: 'smoothstep',
  //         animated: true,
  //       });
  //       continue;
  //     }
  //
  //     if (type === 'hasMany' && target === collection.name) {
  //       if (!targetFieldExists(tk)) continue;
  //
  //       edges.push({
  //         id: `${collection.name}-${tk}-to-${fieldName}`,
  //         source: target,
  //         sourceHandle: `${collection.name}-${tk}-source-left`,
  //         target: collection.name,
  //         targetHandle: `${collection.name}-${fieldName}-target-left`,
  //         type: 'smoothstep',
  //         animated: true,
  //       });
  //       continue;
  //     }
  //
  //     if (type === 'hasMany') {
  //       if (!targetFieldExists(tk)) continue;
  //
  //       edges.push({
  //         id: `${collection.name}-${tk}-to-${fieldName}`,
  //         source: target,
  //         sourceHandle: `${target}-${tk}-source-right`,
  //         target: collection.name,
  //         targetHandle: `${collection.name}-${fieldName}-target-left`,
  //         // type: 'smoothstep',
  //         animated: true,
  //       });
  //       continue;
  //     }
  //
  //     if (type === 'hasOne') {
  //       if (!targetFieldExists(fk)) continue;
  //
  //       edges.push({
  //         id: `${collection.name}-${fieldName}-to-${fk}`,
  //         source: collection.name,
  //         sourceHandle: `${collection.name}-${fieldName}-source-right`,
  //         target,
  //         targetHandle: `${target}-${fk}-target-left`,
  //         // type: 'smoothstep',
  //         animated: true,
  //       });
  //       continue;
  //     }
  //
  //     // if (type === 'belongsToMany') {
  //     //   let label = '';
  //     //   if (through && collectionMap.has(through)) {
  //     //     const throughCollection = collectionMap.get(through);
  //     //     const throughFields = throughCollection.fields || [];
  //     //     const hasCurrent = throughFields.some((f: any) => f.target === collection.name);
  //     //     const hasTarget = throughFields.some((f: any) => f.target === target);
  //     //
  //     //     if (!hasCurrent || !hasTarget) continue;
  //     //     label = `via ${through}`;
  //     //   } else {
  //     //     label = through ? `via ${through}` : 'via ?';
  //     //   }
  //     //
  //     //   edges.push({
  //     //     id: `${collection.name}-${fieldName}-to-${target}`,
  //     //     source: collection.name,
  //     //     sourceHandle: `${collection.name}-${fieldName}-source`,
  //     //     target,
  //     //     targetHandle: `${target}-${fieldName}-target`,
  //     //     type: 'smoothstep',
  //     //     animated: true,
  //     //     label,
  //     //   });
  //     // }
  //   }
  // }

  return layoutElements(nodes, edges);
};

export const Diagram: React.FC<{
  collections: any[];
}> = ({ collections }) => {
  const { isDarkTheme } = useGlobalTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    getDiagramData(collections)
      // @ts-ignore
      .then(({ nodes, edges }) => {
        setNodes(nodes);
        setEdges(edges);
      })
      .catch((error) => console.error('Error laying out elements:', error));
  }, [collections]);

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        svg:not(:root) {
          overflow: unset;
        }
      `}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag={true}
        zoomOnScroll={true}
        proOptions={{ hideAttribution: true }}
        onNodesChange={onNodesChange}
        // @ts-ignore
        colorMode={isDarkTheme ? 'dark' : 'light'}
      >
        <Background />
        <Controls position="top-right" />
      </ReactFlow>
    </div>
  );
};
