/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'tickets_filter_ant_style',
  content: String.raw`// Tickets Filter Block - Ant Design Style
// Configure block UID (needs to be replaced with actual UID)
const ticketsBlockUid = 'f88ed4e5ef3'; // Replace with actual tickets list block UID

// State management
let selectedFilter = 'all';
let isExpanded = false;

// Load icon library
await ctx.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

// Predefined filter configurations
const filterConfigs = [
  { key: 'all', label: 'All', icon: 'fa-th-large', filter: {"$and":[]} },
  { key: 'new', label: 'New/Open', icon: 'fa-star', filter: { status: { $in: ['new', 'open'] } } },
  { key: 'in_progress', label: 'Progress', icon: 'fa-spinner', filter: { status: 'in_progress' } },
  { key: 'pending_customer', label: 'Pend.Cust', icon: 'fa-user-clock', filter: { status: 'pending_customer' } },
  { key: 'pending_sales', label: 'Pend.Sales', icon: 'fa-dollar-sign', filter: { status: 'pending_sales' } },
  { key: 'on_hold', label: 'Hold', icon: 'fa-pause-circle', filter: { status: 'on_hold' } },
  { key: 'resolved', label: 'Resolved', icon: 'fa-check-circle', filter: { status: 'resolved' } },
  { key: 'closed', label: 'Closed', icon: 'fa-lock', filter: { status: 'closed' } },
  { key: 'high_priority', label: 'High Pri', icon: 'fa-exclamation-triangle', filter: { priority: { $in: ['urgent', 'high'] } } },
  { key: 'technical', label: 'Tech', icon: 'fa-cog', filter: { problem_type: { $in: ['technical', 'hardware', 'software'] } } },
  { key: 'unassigned', label: 'Unassign', icon: 'fa-user-slash', filter: { assigneeUserId: null } },
  { key: 'my_tickets', label: 'Mine', icon: 'fa-user', filter: { assigneeUserId: ctx.user?.id } },
  { key: 'today', label: 'Today', icon: 'fa-calendar-day', filter: { createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)).toISOString() } } },
  { key: 'overdue', label: 'Overdue', icon: 'fa-clock', filter: {
    first_responded_at: null,
    status: { $notIn: ['closed', 'resolved'] }
  }}
];

// Save SQL configuration
if (ctx.flowSettingsEnabled) {
  const today = new Date(new Date().setHours(0,0,0,0)).toISOString();

  await ctx.sql.save({
    uid: ctx.model.uid,
    sql: \`
      WITH ticket_stats AS (
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status IN ('new', 'open') THEN 1 END) as new_count,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN status = 'pending_customer' THEN 1 END) as pending_customer_count,
          COUNT(CASE WHEN status = 'pending_sales' THEN 1 END) as pending_sales_count,
          COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_count,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
          COUNT(CASE WHEN priority IN ('urgent', 'high') THEN 1 END) as high_priority_count,
          COUNT(CASE WHEN problem_type IN ('technical', 'hardware', 'software') THEN 1 END) as technical_count,
          COUNT(CASE WHEN "assigneeUserId" IS NULL THEN 1 END) as unassigned_count,
          COUNT(CASE WHEN "assigneeUserId" = \${ctx.user?.id || 0} THEN 1 END) as my_tickets_count,
          COUNT(CASE WHEN "createdAt" >= '\${today}' THEN 1 END) as today_count,
          COUNT(CASE WHEN first_responded_at IS NULL AND status NOT IN ('closed', 'resolved') THEN 1 END) as overdue_count
        FROM tickets
      )
      SELECT * FROM ticket_stats
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
  'new': stats.new_count || 0,
  'in_progress': stats.in_progress_count || 0,
  'pending_customer': stats.pending_customer_count || 0,
  'pending_sales': stats.pending_sales_count || 0,
  'on_hold': stats.on_hold_count || 0,
  'resolved': stats.resolved_count || 0,
  'closed': stats.closed_count || 0,
  'high_priority': stats.high_priority_count || 0,
  'technical': stats.technical_count || 0,
  'unassigned': stats.unassigned_count || 0,
  'my_tickets': stats.my_tickets_count || 0,
  'today': stats.today_count || 0,
  'overdue': stats.overdue_count || 0
};

// Apply filter
function applyFilter(filterKey) {
  const config = filterConfigs.find(c => c.key === filterKey);
  if (!config) return;

  try {
    const targetModel = ctx.engine.getModel(ticketsBlockUid);
    if (!targetModel) {
      ctx.message.warning(\`Target block not found (UID: \${ticketsBlockUid})\`);
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
        ctx.message.info('Showing all tickets');
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
  const containerWidth = ctx.element.offsetWidth || 800;
  const buttonWidth = 120;
  const gap = 6;
  const padding = 16;
  const moreButtonWidth = 80;

  const availableWidth = containerWidth - padding - moreButtonWidth;
  const maxVisible = Math.floor(availableWidth / (buttonWidth + gap));

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
  statMapping['new'] = newStats.new_count || 0;
  statMapping['in_progress'] = newStats.in_progress_count || 0;
  statMapping['pending_customer'] = newStats.pending_customer_count || 0;
  statMapping['pending_sales'] = newStats.pending_sales_count || 0;
  statMapping['on_hold'] = newStats.on_hold_count || 0;
  statMapping['resolved'] = newStats.resolved_count || 0;
  statMapping['closed'] = newStats.closed_count || 0;
  statMapping['high_priority'] = newStats.high_priority_count || 0;
  statMapping['technical'] = newStats.technical_count || 0;
  statMapping['unassigned'] = newStats.unassigned_count || 0;
  statMapping['my_tickets'] = newStats.my_tickets_count || 0;
  statMapping['today'] = newStats.today_count || 0;
  statMapping['overdue'] = newStats.overdue_count || 0;

  render();
});`,
};
