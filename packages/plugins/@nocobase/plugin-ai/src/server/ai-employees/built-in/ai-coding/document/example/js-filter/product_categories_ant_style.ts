/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'product_categories_ant_style',
  content: String.raw`// Product Categories Tree - Ant Design Style
ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('product_categories');
if (typeof ctx.resource.setPageSize === 'function') {
  ctx.resource.setPageSize(200);
}
ctx.resource.setFields(['id', 'name', 'description', 'parentId']);

// Load icon library
await ctx.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

await ctx.resource.refresh();

// Get product list model for filtering
const listModel = ctx.engine.getModel('b542ef8c56f'); // Replace with actual product list block UID

// State management
const state = {
  activeId: null,
  expandedIds: new Set(),
  initialized: false,
  searchText: '',
  searchVisible: false,
};

// Common button styles
const buttonStyles = {
  base: \`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
  \`,
  primary: \`
    border: none;
    background: #1677ff;
    color: #fff;
  \`,
  default: \`
    border: 1px solid #d9d9d9;
    background: #fff;
    color: rgba(0,0,0,0.65);
  \`,
  small: \`
    width: 24px;
    height: 24px;
  \`,
  text: \`
    padding: 4px 15px;
    width: auto;
    font-size: 14px;
  \`
};

// Apply filter to product list
async function applyFilter() {
  if (!listModel?.resource) return;
  const resource = listModel.resource;

  if (typeof resource.removeFilterGroup === 'function') {
    resource.removeFilterGroup(ctx.model.uid);
  }

  if (state.activeId) {
    if (typeof resource.addFilterGroup === 'function') {
      resource.addFilterGroup(ctx.model.uid, { 'category_id.$eq': state.activeId });
    } else if (typeof resource.setFilter === 'function') {
      resource.setFilter({ 'category_id.$eq': state.activeId });
    }
  }

  try {
    await resource.refresh();
  } catch (error) {
    ctx.message.error('Product list refresh failed: ' + error.message);
    console.error('applyFilter error:', error);
  }
}

// Build tree structure
function buildTree(categories) {
  const map = new Map();
  const roots = [];

  // First pass: create all nodes
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const node = map.get(cat.id);
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Escape HTML
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Filter tree by search text
function filterTree(nodes, searchText) {
  if (!searchText) return nodes;

  const search = searchText.toLowerCase();
  const filtered = [];

  nodes.forEach(node => {
    const name = (node.name || '').toLowerCase();
    const desc = (node.description || '').toLowerCase();
    const childrenMatch = filterTree(node.children || [], searchText);

    if (name.includes(search) || desc.includes(search) || childrenMatch.length > 0) {
      filtered.push({
        ...node,
        children: childrenMatch
      });
    }
  });

  return filtered;
}

// Render tree node
function renderTreeNode(node, level = 0) {
  const id = Number(node.id);
  const isActive = state.activeId === id;
  const isExpanded = state.expandedIds.has(id);
  const hasChildren = node.children && node.children.length > 0;
  const name = escapeHtml(node.name ?? 'Unnamed');
  const desc = escapeHtml(node.description ?? '');

  const nodeHtml = \`
    <div class="tree-node" data-id="\${id}" data-level="\${level}" style="
      display: flex;
      align-items: center;
      height: 32px;
      padding: 0 8px;
      padding-left: \${8 + level * 24}px;
      cursor: pointer;
      transition: all 0.3s;
      \${isActive ? 'background: #e6f4ff;' : ''}
    ">
      \${hasChildren ? \`
        <span data-action="toggle-expand" data-id="\${id}" class="tree-toggle" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-right: 8px;
          color: rgba(0,0,0,0.45);
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s;
        ">
          <i class="fas fa-chevron-\${isExpanded ? 'down' : 'right'}" style="font-size: 10px;"></i>
        </span>
      \` : \`
        <span style="width: 28px; display: inline-block;"></span>
      \`}

      <span data-action="filter" data-id="\${id}" style="
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: \${isActive ? '#1677ff' : 'rgba(0,0,0,0.88)'};
        font-weight: \${isActive ? '500' : '400'};
      ">
        <span>\${name}</span>
        \${desc ? \`<span style="font-size: 12px; color: rgba(0,0,0,0.45);">\${desc}</span>\` : ''}
      </span>

      <div class="node-actions" style="display: none; gap: 4px; align-items: center;">
        <button type="button" data-action="add-child" data-id="\${id}" title="Add Child"
          style="\${buttonStyles.base}\${buttonStyles.default}\${buttonStyles.small}color: #52c41a;">
          <i class="fas fa-plus" style="font-size: 11px;"></i>
        </button>
        <button type="button" data-action="edit" data-id="\${id}" title="Edit"
          style="\${buttonStyles.base}\${buttonStyles.default}\${buttonStyles.small}color: #1677ff;">
          <i class="fas fa-edit" style="font-size: 11px;"></i>
        </button>
        <button type="button" data-action="delete" data-id="\${id}" title="Delete"
          style="\${buttonStyles.base}\${buttonStyles.default}\${buttonStyles.small}color: #ff4d4f;">
          <i class="fas fa-trash" style="font-size: 11px;"></i>
        </button>
      </div>
    </div>
  \`;

  let childrenHtml = '';
  if (hasChildren && isExpanded) {
    childrenHtml = node.children.map(child => renderTreeNode(child, level + 1)).join('');
  }

  return nodeHtml + childrenHtml;
}

// Render function
function render() {
  const categories = ctx.resource.getData() || [];
  const tree = buildTree(categories);

  // Initialize: expand all nodes on first render
  if (!state.initialized && categories.length > 0) {
    state.initialized = true;
    categories.forEach(cat => {
      if (cat.parentId && categories.some(c => c.id === cat.parentId)) {
        state.expandedIds.add(cat.parentId);
      }
    });
  }

  // Filter tree by search
  const filteredTree = filterTree(tree, state.searchText);

  // Tree HTML
  const treeHtml = filteredTree.length === 0
    ? \`
      <div style="
        padding: 32px;
        text-align: center;
        color: rgba(0,0,0,0.25);
        font-size: 14px;
      ">
        <i class="fas fa-folder-open" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
        No categories yet
      </div>
    \`
    : filteredTree.map(node => renderTreeNode(node)).join('');

  // Search overlay
  const searchOverlay = state.searchVisible ? \`
    <div style="
      position: absolute;
      top: 12px;
      left: 16px;
      right: 16px;
      z-index: 10;
      background: #fff;
    ">
      <div style="position: relative;">
        <i class="fas fa-search" style="
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0,0,0,0.25);
          font-size: 12px;
          pointer-events: none;
        "></i>
        <input
          type="text"
          placeholder="Search categories..."
          value="\${state.searchText}"
          data-action="search-input"
          autocomplete="off"
          style="
            width: 100%;
            height: 32px;
            padding: 0 40px 0 30px;
            font-size: 14px;
            border: 1px solid #40a9ff;
            border-radius: 4px;
            outline: none;
            background: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s;
          "
          onkeydown="event.stopPropagation()"
          oninput="event.stopPropagation()"
        />
        <i class="fas fa-times" data-action="close-search" style="
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0,0,0,0.45);
          font-size: 12px;
          cursor: pointer;
          padding: 4px;
        "></i>
      </div>
    </div>
  \` : '';

  // Main HTML
  ctx.element.innerHTML = \`
    <div style="background: #fff; border-radius: 6px;">
      <div style="
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        position: relative;
      ">
        \${searchOverlay}

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <button type="button" data-action="toggle-search" title="Search"
            style="\${buttonStyles.base}\${state.searchText ?
              'border: 1px solid #40a9ff; background: #e6f4ff; color: #1677ff;' :
              buttonStyles.default}">
            <i class="fas fa-search" style="font-size: 12px;"></i>
          </button>

          <div style="display: flex; gap: 4px;">
            <button type="button" data-action="add-root" title="Add Category"
              style="\${buttonStyles.base}\${buttonStyles.primary}">
              <i class="fas fa-plus" style="font-size: 12px;"></i>
            </button>
            <button type="button" data-action="refresh" title="Refresh"
              style="\${buttonStyles.base}\${buttonStyles.default}">
              <i class="fas fa-sync-alt" style="font-size: 12px;"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="tree-container" style="
        max-height: 400px;
        overflow-y: auto;
        overflow-x: hidden;
      ">
        \${treeHtml}
      </div>
    </div>

    <style>
      .tree-node:hover {
        background: #fafafa !important;
      }
      .tree-node:hover .node-actions {
        display: flex !important;
      }
      .tree-toggle:hover {
        background: rgba(0,0,0,0.04);
      }
      .node-actions button:hover {
        border-color: currentColor !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
      }
      button:hover {
        opacity: 0.8;
      }
      button:active {
        transform: scale(0.95);
      }
    </style>
  \`;
}

// Event handlers
async function handleClick(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  const action = actionTarget.dataset.action;
  const id = Number(actionTarget.dataset.id);

  switch(action) {
    case 'toggle-expand':
      event.stopPropagation();
      if (state.expandedIds.has(id)) {
        state.expandedIds.delete(id);
      } else {
        state.expandedIds.add(id);
      }
      render();
      break;

    case 'filter':
      state.activeId = state.activeId === id ? null : (Number.isFinite(id) ? id : null);
      render();
      await applyFilter();
      break;

    case 'add-root':
      ctx.openView(\`\${ctx.model.uid}-add\`, {
        mode: 'dialog',
        size: 'small',
        title: 'Add Category',
        pageModelClass: 'ChildPageModel',
        collectionName: 'product_categories',
        dataSourceKey: 'main'
      });
      break;

    case 'add-child':
      ctx.openView(\`\${ctx.model.uid}-add\`, {
        mode: 'dialog',
        size: 'small',
        title: 'Add Subcategory',
        pageModelClass: 'ChildPageModel',
        collectionName: 'product_categories',
        dataSourceKey: 'main'
      });
      break;

    case 'edit':
      if (!Number.isFinite(id)) return;
      const category = (ctx.resource.getData() || []).find(c => c.id === id);
      if (!category) return;

      ctx.openView(\`\${ctx.model.uid}-edit\`, {
        mode: 'dialog',
        size: 'small',
        title: 'Edit Category',
        pageModelClass: 'ChildPageModel',
        collectionName: 'product_categories',
        filterByTk: id,
        dataSourceKey: 'main'
      });
      break;

    case 'delete':
      if (!Number.isFinite(id)) return;
      if (confirm('Delete this category and all its subcategories?')) {
        try {
          ctx.message.loading('Deleting...');
          await ctx.resource.destroy(id);
          await ctx.resource.refresh();
          if (state.activeId === id) {
            state.activeId = null;
          }
          state.expandedIds.delete(id);
          ctx.message.success('Category deleted');
          render();
          await applyFilter();
        } catch (error) {
          ctx.message.error('Delete failed: ' + error.message);
          console.error('Delete category error:', error);
        }
      }
      break;

    case 'refresh':
      ctx.message.loading('Refreshing...');
      await ctx.resource.refresh();
      ctx.message.success('Refreshed');
      render();
      break;

    case 'toggle-search':
      state.searchVisible = !state.searchVisible;
      render();
      if (state.searchVisible) {
        setTimeout(() => {
          const input = ctx.element.querySelector('input[data-action="search-input"]');
          if (input) input.focus();
        }, 0);
      }
      break;

    case 'close-search':
      state.searchVisible = false;
      state.searchText = '';
      render();
      break;
  }
}

// Handle search input
function handleSearch(event) {
  const input = event.target;
  if (input.dataset.action !== 'search-input') return;

  state.searchText = input.value;

  // Auto-expand all when searching
  if (input.value) {
    const categories = ctx.resource.getData() || [];
    categories.forEach(cat => {
      if (cat.parentId) {
        state.expandedIds.add(cat.parentId);
      }
    });
  }

  render();
}

// Bind events
function ensureBound() {
  if (ctx.element._bound) return;
  ctx.element._bound = true;
  ctx.element.addEventListener('click', handleClick);
  ctx.element.addEventListener('input', handleSearch);
}

ensureBound();
render();`,
};
