/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'leads_filter_ant_style',
  content: String.raw`// Leads Filter Block - Ant Design Style
// Configure block UID (needs to be replaced with actual UID)
const leadsBlockUid = 'f84d922c772'; // Replace with actual leads list block UID

// State management
let selectedFilter = 'all';
let isExpanded = false;

// Load icon library
await ctx.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

// Predefined filter configurations
const filterConfigs = [
  { key: 'all', label: 'All', icon: 'fa-th-large', filter: {"$and":[]} },
  { key: 'public', label: 'Public', icon: 'fa-globe', filter: { is_public: true } },
  { key: 'my', label: 'My Leads', icon: 'fa-user', filter: { owner_id: ctx.user?.id } },
  { key: 'unqualified', label: 'Unqualified', icon: 'fa-times-circle', filter: { status: 'Unqualified' } },
  { key: 'initial', label: 'Initial', icon: 'fa-phone', filter: { status: 'Initial Contact' } },
  { key: 'interest', label: 'Interest', icon: 'fa-heart', filter: { status: 'Interest Cultivation' } },
  { key: 'followup', label: 'Follow-up', icon: 'fa-user-check', filter: { status: 'Deep Follow-up' } },
  { key: 'success', label: 'Success', icon: 'fa-trophy', filter: { status: 'Success' } },
  { key: 'web', label: 'From Web', icon: 'fa-globe', filter: { source: 'Web' } },
  { key: 'email', label: 'From Email', icon: 'fa-envelope', filter: { source: 'Email' } },
  { key: 'today', label: 'Today', icon: 'fa-calendar-day', filter: { createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)).toISOString() } } },
  { key: 'week', label: 'This Week', icon: 'fa-calendar-week', filter: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } } },
  { key: 'month', label: 'This Month', icon: 'fa-calendar-alt', filter: {
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    }
  }}
];

// Save SQL configuration
if (ctx.flowSettingsEnabled) {
  const today = new Date(new Date().setHours(0,0,0,0)).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  await ctx.sql.save({
    uid: ctx.model.uid,
    sql: \`
      WITH lead_stats AS (
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN is_public = true THEN 1 END) as public_count,
          COUNT(CASE WHEN owner_id = \${ctx.user?.id || 0} THEN 1 END) as my_count,
          COUNT(CASE WHEN status = 'Unqualified' THEN 1 END) as unqualified_count,
          COUNT(CASE WHEN status = 'Initial Contact' THEN 1 END) as initial_count,
          COUNT(CASE WHEN status = 'Interest Cultivation' THEN 1 END) as interest_count,
          COUNT(CASE WHEN status = 'Deep Follow-up' THEN 1 END) as followup_count,
          COUNT(CASE WHEN status = 'Success' THEN 1 END) as success_count,
          COUNT(CASE WHEN source = 'Web' THEN 1 END) as web_count,
          COUNT(CASE WHEN source = 'Email' THEN 1 END) as email_count,
          COUNT(CASE WHEN "createdAt" >= '\${today}' THEN 1 END) as today_count,
          COUNT(CASE WHEN "createdAt" >= '\${weekAgo}' THEN 1 END) as week_count,
          COUNT(CASE WHEN "createdAt" >= '\${monthStart}' THEN 1 END) as month_count
        FROM lead
      )
      SELECT * FROM lead_stats
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
  'public': stats.public_count || 0,
  'my': stats.my_count || 0,
  'unqualified': stats.unqualified_count || 0,
  'initial': stats.initial_count || 0,
  'interest': stats.interest_count || 0,
  'followup': stats.followup_count || 0,
  'success': stats.success_count || 0,
  'web': stats.web_count || 0,
  'email': stats.email_count || 0,
  'today': stats.today_count || 0,
  'week': stats.week_count || 0,
  'month': stats.month_count || 0
};

// Apply filter
function applyFilter(filterKey) {
  const config = filterConfigs.find(c => c.key === filterKey);
  if (!config) return;

  try {
    const targetModel = ctx.engine.getModel(leadsBlockUid);
    if (!targetModel) {
      ctx.message.warning(\`Target block not found (UID: \${leadsBlockUid})\`);
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
        ctx.message.info('Showing all leads');
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
  statMapping['public'] = newStats.public_count || 0;
  statMapping['my'] = newStats.my_count || 0;
  statMapping['unqualified'] = newStats.unqualified_count || 0;
  statMapping['initial'] = newStats.initial_count || 0;
  statMapping['interest'] = newStats.interest_count || 0;
  statMapping['followup'] = newStats.followup_count || 0;
  statMapping['success'] = newStats.success_count || 0;
  statMapping['web'] = newStats.web_count || 0;
  statMapping['email'] = newStats.email_count || 0;
  statMapping['today'] = newStats.today_count || 0;
  statMapping['week'] = newStats.week_count || 0;
  statMapping['month'] = newStats.month_count || 0;

  render();
});`,
};
