/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { theme } from 'antd';
import { css } from '@emotion/css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Background, Controls, ReactFlow, type Edge, type Node, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGlobalTheme } from '@nocobase/client-v2';
import { CollectionNode } from './CollectionNode';
import type { CollectionDataType, FieldDataType } from './types';

const elk = new ELK();

const nodeTypes = {
  collection: CollectionNode,
};

type LayoutedNode = Node & {
  x?: number;
  y?: number;
};

type ElkGraph = {
  children?: LayoutedNode[];
  edges?: Edge[];
};

const layoutElements = async (nodes: Node[], edges: Edge[], nodeWidth: number, rowHeight: number) => {
  const isHorizontal = !edges.length;
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': edges.length ? 'org.eclipse.elk.layered' : 'org.eclipse.elk.box',
    },
    children: nodes.map((node) => ({
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      width: nodeWidth,
      height: rowHeight * (((node.data as { fields?: FieldDataType[] }).fields?.length || 0) + 1),
    })),
    edges,
  };

  const layoutedGraph = (await elk.layout(graph as unknown as Parameters<typeof elk.layout>[0])) as unknown as ElkGraph;
  return {
    nodes:
      layoutedGraph.children?.map((node) => ({
        ...node,
        position: { x: node.x || 0, y: node.y || 0 },
      })) || [],
    edges: layoutedGraph.edges || [],
  };
};

const buildDiagramData = (collections: CollectionDataType[]) => {
  const nextCollections = collections.map((collection) => ({
    ...collection,
    fields:
      collection.autoGenId && !collection.fields.some((field) => field.name === 'id')
        ? [
            {
              name: 'id',
              interface: 'id',
              type: 'bigInt',
              title: 'ID',
              primaryKey: true,
              autoIncrement: true,
            },
            ...collection.fields,
          ]
        : [...collection.fields],
  }));
  const collectionMap = new Map(nextCollections.map((collection) => [collection.name, collection]));
  const edgeSet = new Set<string>();

  const nodes: Node[] = nextCollections.map((collection) => ({
    id: collection.name,
    type: 'collection',
    position: { x: 0, y: 0 },
    data: {
      title: collection.title,
      name: collection.name,
      fields: [...collection.fields],
    },
  }));

  const edges: Edge[] = [];
  const addEdge = (source: string, target: string) => {
    const key1 = `${source}-${target}`;
    const key2 = `${target}-${source}`;
    if (edgeSet.has(key1) || edgeSet.has(key2)) {
      return;
    }

    edges.push({
      id: key1,
      source,
      sourceHandle: source,
      target,
      targetHandle: target,
      type: 'smoothstep',
      animated: true,
    });
    edgeSet.add(key1);
  };

  for (const collection of nextCollections) {
    for (const field of collection.fields) {
      const target = typeof field.target === 'string' ? field.target : undefined;
      const through = typeof field.through === 'string' ? field.through : undefined;

      if (!target || target === collection.name) {
        continue;
      }

      if (field.type === 'belongsToMany') {
        if (through && collectionMap.has(through)) {
          addEdge(collection.name, through);
          addEdge(through, target);
        } else {
          addEdge(collection.name, target);
        }
      } else {
        addEdge(collection.name, target);
      }
    }
  }

  return { nodes, edges };
};

export const Diagram: React.FC<{ collections: CollectionDataType[] }> = ({ collections }) => {
  const { isDarkTheme } = useGlobalTheme();
  const { token } = theme.useToken();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const diagramData = useMemo(() => buildDiagramData(collections), [collections]);
  const nodeWidth = token.controlHeightLG * 8;
  const rowHeight = token.controlHeightLG + token.paddingSM;

  useEffect(() => {
    layoutElements(diagramData.nodes, diagramData.edges, nodeWidth, rowHeight)
      .then((layoutedData) => {
        setNodes(layoutedData.nodes);
        setEdges(layoutedData.edges);
      })
      .catch((error) => console.error('Error laying out elements:', error));
  }, [diagramData, nodeWidth, rowHeight, setEdges, setNodes]);

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
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        colorMode={isDarkTheme ? 'dark' : 'light'}
      >
        <Background />
        <Controls position="top-right" />
      </ReactFlow>
    </div>
  );
};
