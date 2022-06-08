import type { ReactNode, ComponentProps } from 'react';
import React, { useEffect, useState, createRef } from 'react';
import type { TreeProps } from 'rc-tree';
import Tree from 'rc-tree';
import type { EventDataNode } from 'rc-tree/lib/interface';
import type { CSSMotionProps, MotionEventHandler, MotionEndEventHandler } from 'rc-motion';
import './Tree.less';

const FileOutlined = <svg xmlns="http://www.w3.org/2000/svg" className="__dumi-site-tree-icon icon-file" fill="currentcolor" viewBox="0 0 1024 1024"><path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216v494z"/></svg>;
const FolderOpenOutlined = <svg xmlns="http://www.w3.org/2000/svg" className="__dumi-site-tree-icon icon-folder-open" fill="currentcolor" viewBox="0 0 1024 1024"><path d="M928 444H820V330.4c0-17.7-14.3-32-32-32H473L355.7 186.2a8.15 8.15 0 0 0-5.5-2.2H96c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h698c13 0 24.8-7.9 29.7-20l134-332c1.5-3.8 2.3-7.9 2.3-12 0-17.7-14.3-32-32-32zM136 256h188.5l119.6 114.4H748V444H238c-13 0-24.8 7.9-29.7 20L136 643.2V256zm635.3 512H159l103.3-256h612.4L771.3 768z"/></svg>;
const FolderOutlined = <svg xmlns="http://www.w3.org/2000/svg" className="__dumi-site-tree-icon icon-folder" fill="currentcolor" viewBox="0 0 1024 1024"><path d="M880 298.4H521L403.7 186.2a8.15 8.15 0 0 0-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM840 768H184V256h188.5l119.6 114.4H840V768z"/></svg>;
const MinusSquareOutlined = <svg xmlns="http://www.w3.org/2000/svg" className="__dumi-site-tree-icon icon-minus-square" fill="currentcolor" viewBox="0 0 1024 1024"><path d="M328 544h368c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z"/><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"/></svg>;
const PlusSquareOutlined = <svg xmlns="http://www.w3.org/2000/svg" className="__dumi-site-tree-icon icon-plus-square" fill="currentcolor" viewBox="0 0 1024 1024"><path d="M328 544h152v152c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V544h152c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H544V328c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v152H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z"/><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"/></svg>;

function getTreeFromList(nodes: ReactNode, prefix = '') {
  const data: TreeProps['treeData'] = [];

  [].concat(nodes).forEach((node, i) => {
    const key = `${prefix ? `${prefix}-` : ''}${i}`;

    switch (node.type) {
      case 'ul':
        const parent = data[data.length - 1]?.children || data;
        const ulLeafs = getTreeFromList(node.props.children || [], key);

        parent.push(...ulLeafs);
        break;

      case 'li':
        const liLeafs = getTreeFromList(node.props.children, key);

        data.push({
          title: [].concat(node.props.children).filter(child => child.type !== 'ul'),
          key,
          children: liLeafs,
          isLeaf: !liLeafs.length,
        });
        break;

      default:
    }
  });

  return data;
}

const useListToTree = (nodes: ReactNode) => {
  const [tree, setTree] = useState(getTreeFromList(nodes));

  useEffect(() => {
    setTree(getTreeFromList(nodes));
  }, [nodes]);

  return tree;
};

const getIcon = (props) => {
  const { isLeaf, expanded } = props;
  if (isLeaf) {
    return FileOutlined;
  }
  return expanded ? FolderOpenOutlined : FolderOutlined;
}

const renderSwitcherIcon = (props) => {
  const { isLeaf, expanded } = props;
  if (isLeaf) {
    return <span className={`tree-switcher-leaf-line`} />;
  }
  return expanded ? (
    <span className={`tree-switcher-line-icon`}>{MinusSquareOutlined}</span>
  ) : (
    <span className={`tree-switcher-line-icon`}>{PlusSquareOutlined}</span>
  );
}

// ================== Collapse Motion ==================
const getCollapsedHeight: MotionEventHandler = () => ({ height: 0, opacity: 0 });
const getRealHeight: MotionEventHandler = node => ({ height: node.scrollHeight, opacity: 1 });
const getCurrentHeight: MotionEventHandler = node => ({ height: node.offsetHeight });
const skipOpacityTransition: MotionEndEventHandler = (_, event) =>
  (event as TransitionEvent).propertyName === 'height';

const collapseMotion: CSSMotionProps = {
  motionName: 'ant-motion-collapse',
  onAppearStart: getCollapsedHeight,
  onEnterStart: getCollapsedHeight,
  onAppearActive: getRealHeight,
  onEnterActive: getRealHeight,
  onLeaveStart: getCurrentHeight,
  onLeaveActive: getCollapsedHeight,
  onAppearEnd: skipOpacityTransition,
  onEnterEnd: skipOpacityTransition,
  onLeaveEnd: skipOpacityTransition,
  motionDeadline: 500,
};

export default (props: ComponentProps<'div'>) => {
  const data = useListToTree(props.children);

  const treeRef = createRef<Tree>();

  const onClick = (event: React.MouseEvent<HTMLElement>, node: EventDataNode) =>{
    const { isLeaf } = node;

    if (isLeaf || event.shiftKey || event.metaKey || event.ctrlKey) {
      return;
    }
    treeRef.current!.onNodeExpand(event as any, node);
  };

  return (
    <Tree
      className="__dumi-site-tree"
      icon={getIcon}
      ref={treeRef}
      itemHeight={20}
      showLine={true}
      selectable={false}
      motion={{
        ...collapseMotion,
        motionAppear: false
      }}
      onClick={onClick}
      treeData={[{ key: '0', title: props.title || '<root>', children: data }]}
      defaultExpandAll
      switcherIcon={renderSwitcherIcon}
    />
  );
};
