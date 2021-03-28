import deepmerge from 'deepmerge';

export const flatToTree = (flatArray, options) => {
  options = {
    id: "id",
    parentId: "parentId",
    children: "children",
    ...options
  };
  const dictionary = {}; // a hash table mapping to the specific array objects with their ids as key
  const tree = [];
  const children = options.children;
  flatArray.forEach(node => {
    const nodeId = node[options.id];
    const nodeParentId = node[options.parentId];
    // set up current node data in dictionary
    dictionary[nodeId] = {
      [children]: [], // init a children property
      ...node, // add other propertys
      ...dictionary[nodeId] // children will be replaced if this node already has children property which was set below
    };
    dictionary[nodeParentId] = dictionary[nodeParentId] || { [children]: [] }; // if it's not exist in dictionary, init an object with children property
    dictionary[nodeParentId][children].push(dictionary[nodeId]); // add reference to current node object in parent node object
  });
  // find root nodes
  Object.values(dictionary).forEach(obj => {
    if (typeof obj[options.id] === "undefined") {
      tree.push(...obj[children]);
    }
  });
  return treeData(tree);
};

function treeData(pages: Array<any>) {
  return pages.map(data => {
    return { ...data, children: data.children && data.children.length ? treeData(data.children) : undefined }
  });
}

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

export function merge(obj1: any, obj2: any) {
  return deepmerge(obj1, obj2, {
    arrayMerge: overwriteMerge,
  });
}
