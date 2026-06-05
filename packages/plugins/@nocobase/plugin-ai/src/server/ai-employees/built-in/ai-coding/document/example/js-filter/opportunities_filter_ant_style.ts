/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'opportunities_filter_ant_style',
  content: String.raw`// Opportunities Filter Block - Ant Design Style
// Configure block UID (needs to be replaced with actual UID)
const opportunityBlockUid = 'c60cd46bcc2'; // Replace with actual opportunity list block UID

// State management
let selectedFilter = 'all';
let isExpanded = false;

// Load icon library
await ctx.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

// Predefined filter configurations
const filterConfigs = [
  { key: 'all', label: 'All', icon: 'fa-th-large', filter: {"$and":[]} },
  { key: 'open', label: 'Open', icon: 'fa-folder-open', filter: { stage: { $notIn: ['Win', 'Lose'] } } },
  { key: 'initial', label: 'Initial', icon: 'fa-handshake', filter: { stage: 'Initial Contact' } },
  { key: 'needs', label: 'Needs', icon: 'fa-search', filter: { stage: 'Needs Analysis' } },
  { key: 'solution', label: 'Solution', icon: 'fa-lightbulb', filter: { stage: 'Solution Development' } },
  { key: 'proposal', label: 'Proposal', icon: 'fa-file-alt', filter: { stage: 'Proposal & Negotiation' } },
  { key: 'contract', label: 'Contract', icon: 'fa-file-contract', filter: { stage: 'Contract Review' } },
  { key: 'won', label: 'Won', icon: 'fa-trophy', filter: { stage: 'Win' } },
  { key: 'lost', label: 'Lost', icon: 'fa-times-circle', filter: { stage: 'Lose' } },
  { key: 'high_value', label: 'High Value', icon: 'fa-dollar-sign', filter: { amount: { $gte: 100000 } } },
  { key: 'high_probability', label: 'High Prob', icon: 'fa-percentage', filter: { probability: { $gte: 70 } } },
  { key: 'closing_this_month', label: 'This Month', icon: 'fa-calendar-check', filter: {
    close_date: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      $lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
    }
  }},
  { key: 'overdue', label: 'Overdue', icon: 'fa-exclamation-triangle', filter: {
    close_date: { $lte: new Date().toISOString() },
    stage: { $notIn: ['Win', 'Lose'] }
  }},
  { key: 'my_opportunities', label: 'Mine', icon: 'fa-user', filter: { owner_id: ctx.user?.id } }
];

// Save SQL configuration
if (ctx.flowSettingsEnabled) {
  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();
  const today = new Date().toISOString();

  await ctx.sql.save({
    uid: ctx.model.uid,
    sql: \`
      WITH opportunity_stats AS (
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN stage NOT IN ('Win', 'Lose') THEN 1 END) as open_count,
          COUNT(CASE WHEN stage = 'Initial Contact' THEN 1 END) as initial_count,
          COUNT(CASE WHEN stage = 'Needs Analysis' THEN 1 END) as needs_count,
          COUNT(CASE WHEN stage = 'Solution Development' THEN 1 END) as solution_count,
          COUNT(CASE WHEN stage = 'Proposal & Negotiation' THEN 1 END) as proposal_count,
          COUNT(CASE WHEN stage = 'Contract Review' THEN 1 END) as contract_count,
          COUNT(CASE WHEN stage = 'Win' THEN 1 END) as won_count,
          COUNT(CASE WHEN stage = 'Lose' THEN 1 END) as lost_count,
          COUNT(CASE WHEN amount >= 100000 THEN 1 END) as high_value_count,
          COUNT(CASE WHEN probability >= 70 THEN 1 END) as high_probability_count,
          COUNT(CASE WHEN close_date >= '\${monthStart}' AND close_date <= '\${monthEnd}' THEN 1 END) as closing_this_month_count,
          COUNT(CASE WHEN close_date <= '\${today}' AND stage NOT IN ('Win', 'Lose') THEN 1 END) as overdue_count,
          COUNT(CASE WHEN owner_id = \${ctx.user?.id || 0} THEN 1 END) as my_opportunities_count,
          COALESCE(SUM(amount), 0) as total_pipeline_value,
          COALESCE(SUM(CASE WHEN stage = 'Win' THEN amount END), 0) as won_value,
          COALESCE(SUM(CASE WHEN stage NOT IN ('Win', 'Lose') THEN amount END), 0) as open_value
        FROM opportunity
      )
      SELECT * FROM opportunity_stats
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
  'open': stats.open_count || 0,
  'initial': stats.initial_count || 0,
  'needs': stats.needs_count || 0,
  'solution': stats.solution_count || 0,
  'proposal': stats.proposal_count || 0,
  'contract': stats.contract_count || 0,
  'won': stats.won_count || 0,
  'lost': stats.lost_count || 0,
  'high_value': stats.high_value_count || 0,
  'high_probability': stats.high_probability_count || 0,
  'closing_this_month': stats.closing_this_month_count || 0,
  'overdue': stats.overdue_count || 0,
  'my_opportunities': stats.my_opportunities_count || 0
};

// Format amount
function formatAmount(amount) {
  if (amount >= 1000000) {
    return \`$\${(amount / 1000000).toFixed(1)}M\`;
  } else if (amount >= 1000) {
    return \`$\${(amount / 1000).toFixed(0)}K\`;
  }
  return \`$\${amount}\`;
}

// Apply filter
function applyFilter(filterKey) {
  const config = filterConfigs.find(c => c.key === filterKey);
  if (!config) return;

  try {
    const targetModel = ctx.engine.getModel(opportunityBlockUid);
    if (!targetModel) {
      ctx.message.warning(\`Target block not found (UID: \${opportunityBlockUid})\`);
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
        ctx.message.info('Showing all opportunities');
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

  // Display summary information
  const totalValue = formatAmount(stats.total_pipeline_value || 0);
  const wonValue = formatAmount(stats.won_value || 0);
  const openValue = formatAmount(stats.open_value || 0);

  ctx.element.innerHTML = \`
    <div style="padding: 8px; background: white; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
        <span style="font-size: 12px; color: #6b7280;">
          Pipeline: <strong style="color: #1f2937;">\${openValue}</strong>
          <span style="margin: 0 8px;">•</span>
          Won: <strong style="color: #10b981;">\${wonValue}</strong>
          <span style="margin: 0 8px;">•</span>
          Total: <strong style="color: #3b82f6;">\${totalValue}</strong>
        </span>
      </div>
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
  statMapping['open'] = newStats.open_count || 0;
  statMapping['initial'] = newStats.initial_count || 0;
  statMapping['needs'] = newStats.needs_count || 0;
  statMapping['solution'] = newStats.solution_count || 0;
  statMapping['proposal'] = newStats.proposal_count || 0;
  statMapping['contract'] = newStats.contract_count || 0;
  statMapping['won'] = newStats.won_count || 0;
  statMapping['lost'] = newStats.lost_count || 0;
  statMapping['high_value'] = newStats.high_value_count || 0;
  statMapping['high_probability'] = newStats.high_probability_count || 0;
  statMapping['closing_this_month'] = newStats.closing_this_month_count || 0;
  statMapping['overdue'] = newStats.overdue_count || 0;
  statMapping['my_opportunities'] = newStats.my_opportunities_count || 0;

  render();
});`,
};
