/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'accounts_filter_ant_style',
  content: String.raw`// Accounts Filter Block - Ant Design Style
// Configure block UID (needs to be replaced with actual UID)
const accountBlockUid = 'a233e6cd712'; // Replace with actual account list block UID

// State management
let selectedFilter = 'all';
let isExpanded = false;

// Load icon library
await ctx.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

// Predefined filter configurations
const filterConfigs = [
  { key: 'all', label: 'All', icon: 'fa-th-large', filter: {"$and":[]} },
  { key: 'customer', label: 'Customers', icon: 'fa-users', filter: { type: 'Customer' } },
  { key: 'partner', label: 'Partners', icon: 'fa-handshake', filter: { type: 'Partner' } },
  { key: 'vendor', label: 'Vendors', icon: 'fa-truck', filter: { type: 'Vendor' } },
  { key: 'prospect', label: 'Prospects', icon: 'fa-user-plus', filter: { type: 'Prospect' } },
  { key: 'other', label: 'Other', icon: 'fa-question-circle', filter: { type: 'Other' } },
  { key: 'high_value', label: 'High Value', icon: 'fa-gem', filter: { annual_revenue: { $gte: 1000000 } } },
  { key: 'recent', label: 'Recent', icon: 'fa-clock', filter: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } } },
  { key: 'my_accounts', label: 'My Accounts', icon: 'fa-user', filter: { owner_id: ctx.user?.id } }
];

// Save SQL configuration
if (ctx.flowSettingsEnabled) {
  await ctx.sql.save({
    uid: ctx.model.uid,
    sql: \`
      WITH account_stats AS (
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN type = 'Customer' THEN 1 END) as customer_count,
          COUNT(CASE WHEN type = 'Partner' THEN 1 END) as partner_count,
          COUNT(CASE WHEN type = 'Vendor' THEN 1 END) as vendor_count,
          COUNT(CASE WHEN type = 'Prospect' THEN 1 END) as prospect_count,
          COUNT(CASE WHEN type = 'Other' THEN 1 END) as other_count,
          COUNT(CASE WHEN annual_revenue >= 1000000 THEN 1 END) as high_value_count,
          COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_count,
          COUNT(CASE WHEN owner_id = \${ctx.user?.id || 0} THEN 1 END) as my_accounts_count
        FROM account
      )
      SELECT * FROM account_stats
    \`,
    dataSourceKey: 'main',
  });
}

// Use SQLResource
ctx.useResource('SQLResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setFilterByTk(ctx.model.uid);

// Query statistics data
await ctx.resource.refresh();
const stats = ctx.resource.getData()[0] || {};

// Map statistics data
const statMapping = {
  'all': stats.total || 0,
  'customer': stats.customer_count || 0,
  'partner': stats.partner_count || 0,
  'vendor': stats.vendor_count || 0,
  'prospect': stats.prospect_count || 0,
  'other': stats.other_count || 0,
  'high_value': stats.high_value_count || 0,
  'recent': stats.recent_count || 0,
  'my_accounts': stats.my_accounts_count || 0
};

// Apply filter
function applyFilter(filterKey) {
  const config = filterConfigs.find(c => c.key === filterKey);
  if (!config) return;

  try {
    const targetModel = ctx.engine.getModel(accountBlockUid);
    if (!targetModel) {
      ctx.message.warning(\`Target block not found (UID: \${accountBlockUid})\`);
      return;
    }

    // Clear previous filters
    if (targetModel.resource.filters && targetModel.resource.filters[ctx.model.uid]) {
      delete targetModel.resource.filters[ctx.model.uid];
    }

    // Apply new filter
    if (config.filter) {
      targetModel.resource.addFilterGroup(ctx.model.uid, config.filter);
      if (filterKey === 'all') {
        ctx.message.info('Showing all accounts');
      } else {
        ctx.message.success(\`Applied filter: \${config.label}\`);
      }
    }

    // Refresh target block
    targetModel.resource.refresh();
  } catch (error) {
    ctx.message.error('Filter failed: ' + error.message);
  }
}

// Calculate visible filters based on container width
function calculateVisibleFilters() {
  // Estimate button width (average ~120px per button + gap)
  const containerWidth = ctx.element.offsetWidth || 800;
  const buttonWidth = 120;
  const gap = 6;
  const padding = 16;
  const moreButtonWidth = 80;

  // Calculate how many buttons can fit
  const availableWidth = containerWidth - padding - moreButtonWidth;
  const maxVisible = Math.floor(availableWidth / (buttonWidth + gap));

  // Return at least 3, max all
  return Math.min(Math.max(3, maxVisible), filterConfigs.length);
}

// Render function
function render() {
  // Calculate how many filters to show based on container width
  const maxVisible = calculateVisibleFilters();
  const needsMore = filterConfigs.length > maxVisible;

  // Determine filters to display
  const displayFilters = isExpanded ? filterConfigs : filterConfigs.slice(0, maxVisible);

  ctx.element.innerHTML = \`
    <div style="padding: 8px; background: white; border-radius: 8px;">
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        \${displayFilters.map(config => {
          const count = statMapping[config.key] || 0;
          const isActive = selectedFilter === config.key;

          return \`
            <button class="filter-btn" data-key="\${config.key}" style="
              position: relative;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 5px;
              height: 32px;
              padding: 0px 12px;
              font-size: 14px;
              font-weight: 400;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              white-space: nowrap;
              text-align: center;
              border: 1px solid \${isActive ? 'transparent' : '#d9d9d9'};
              border-radius: 6px;
              background: \${isActive ? '#1677ff' : '#fff'};
              color: \${isActive ? '#fff' : 'rgba(0,0,0,0.88)'};
              box-shadow: \${isActive ? '0 2px 0 rgba(5,145,255,0.1)' : 'none'};
              cursor: pointer;
              transition: all 0.1s cubic-bezier(0.645, 0.045, 0.355, 1);
              user-select: none;
              touch-action: manipulation;
              outline: none;
              -webkit-appearance: button;
              box-sizing: border-box;
            ">
              <i class="fas \${config.icon}" style="
                font-size: 13px;
                opacity: \${isActive ? '1' : '0.75'};
              "></i>
              <span>\${config.label}</span>
              <span style="
                background: \${isActive ? 'rgba(255,255,255,0.25)' : '#f0f0f0'};
                color: \${isActive ? '#fff' : 'rgba(0,0,0,0.65)'};
                padding: 0 5px;
                height: 18px;
                line-height: 18px;
                border-radius: 9px;
                font-size: 12px;
                font-weight: 400;
                min-width: 20px;
                text-align: center;
                display: inline-block;
              ">\${count}</span>
            </button>
          \`;
        }).join('')}

        \${needsMore ? \`
          <button class="filter-btn" id="toggle-more" style="
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            height: 32px;
            padding: 0px 12px;
            font-size: 14px;
            font-weight: 400;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            white-space: nowrap;
            text-align: center;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            background: #fff;
            color: #1677ff;
            box-shadow: none;
            cursor: pointer;
            transition: all 0.1s cubic-bezier(0.645, 0.045, 0.355, 1);
            user-select: none;
            touch-action: manipulation;
            outline: none;
            -webkit-appearance: button;
            box-sizing: border-box;
          ">
            <i class="fas fa-chevron-\${isExpanded ? 'up' : 'down'}" style="
              font-size: 12px;
              opacity: 0.75;
            "></i>
            <span>\${isExpanded ? 'Less' : 'More'}</span>
          </button>
        \` : ''}
      </div>
    </div>

    <style>
      .filter-btn:hover:not([style*="background: #1677ff"]) {
        border-color: #4096ff !important;
        color: #1677ff !important;
      }

      .filter-btn:active {
        transform: scale(0.98);
      }
    </style>
  \`;

  // Bind events
  bindEvents();
}

// Bind events
function bindEvents() {
  const container = ctx.element.querySelector('div');
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn && !btn.id) {
        const key = btn.dataset.key;
        selectedFilter = selectedFilter === key ? 'all' : key;
        applyFilter(selectedFilter);
        render();
      }

      // Expand/collapse more
      if (e.target.closest('#toggle-more')) {
        isExpanded = !isExpanded;
        render();
      }
    });
  }
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    render();
  }, 250);
});

// Listen for data refresh
ctx.resource.on('refresh', () => {
  const newStats = ctx.resource.getData()[0] || {};

  // Update statistics data
  Object.assign(stats, newStats);

  // Update mapping
  statMapping['all'] = newStats.total || 0;
  statMapping['customer'] = newStats.customer_count || 0;
  statMapping['partner'] = newStats.partner_count || 0;
  statMapping['vendor'] = newStats.vendor_count || 0;
  statMapping['prospect'] = newStats.prospect_count || 0;
  statMapping['other'] = newStats.other_count || 0;
  statMapping['high_value'] = newStats.high_value_count || 0;
  statMapping['recent'] = newStats.recent_count || 0;
  statMapping['my_accounts'] = newStats.my_accounts_count || 0;

  render();
});`,
};
