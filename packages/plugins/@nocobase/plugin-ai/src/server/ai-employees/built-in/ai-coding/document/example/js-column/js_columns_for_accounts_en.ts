/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js_columns_for_accounts',
  content: String.raw`# NocoBase JS Column Examples - Accounts Table

## Overview
Practical JavaScript column examples for the accounts table in CRM systems. These aggregated columns combine multiple fields, calculate derived metrics, and provide visual representations to enhance data readability and business insights.

## Selected JS Column Examples

## 1. Account Comprehensive Information Column

Displays core account information including name, number, type, and industry labels. Account name is clickable to open detail dialog.

\`\`\`javascript
// Account info card - Name, number, industry tags with clickable name
const name = ctx.record?.name || 'Unknown';
const accountNumber = ctx.record?.account_number || 'N/A';
const industry = ctx.record?.industry || '';
const type = ctx.record?.type || '';
const account_id = ctx.record?.id;

// Industry mapping and colors
const industryMap = {
  'Technology': { label: 'Tech', color: '#1677ff' },
  'Healthcare': { label: 'Health', color: '#52c41a' },
  'Finance': { label: 'Finance', color: '#faad14' },
  'Retail': { label: 'Retail', color: '#fa8c16' },
  'Education': { label: 'Edu', color: '#2563eb' },
  'Manufacturing': { label: 'Mfg', color: '#eb2f96' },
  'Real estate': { label: 'Real Estate', color: '#fa541c' },
  'Energy': { label: 'Energy', color: '#fadb14' },
  'Government': { label: 'Gov', color: '#73d13d' }
};

const typeMap = {
  'Customer': 'Customer',
  'Partner': 'Partner',
  'Competitor': 'Competitor',
  'Vendor': 'Vendor',
  'Prospect': 'Prospect',
  'Other': 'Other'
};

const industryInfo = industryMap[industry] || { label: industry, color: '#8c8c8c' };
const typeLabel = typeMap[type] || type;

ctx.element.innerHTML = \`
  <div style="display:flex;flex-direction:column;gap:4px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <strong
        class="account-name-link"
        style="color:#000;font-size:14px;cursor:pointer;text-decoration:none;"
        onmouseover="this.style.color='#1677ff';this.style.textDecoration='underline'"
        onmouseout="this.style.color='#000';this.style.textDecoration='none'"
      >\${name}</strong>
      \${type ? \`<span style="padding:2px 6px;background:#f0f5ff;color:#1677ff;border-radius:2px;font-size:11px;">\${typeLabel}</span>\` : ''}
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="color:#8c8c8c;font-size:12px;">\${accountNumber}</span>
      \${industry ? \`<span style="padding:2px 6px;background:\${industryInfo.color}15;color:\${industryInfo.color};border-radius:2px;font-size:11px;">\${industryInfo.label}</span>\` : ''}
    </div>
  </div>
\`;

// Add click handler for account name
if (account_id) {
  const nameLink = ctx.element.querySelector('.account-name-link');
  if (nameLink && !nameLink._eventBound) {
    nameLink._eventBound = true;
    nameLink.addEventListener('click', async () => {
      await ctx.openView('c91bba4e338', {
        collectionName: 'accounts',
        dataSourceKey: 'main',
        filterByTk: account_id
      }); // Account dialog UID
    });
  }
}
\`\`\`

## 2. Health Score Column

Calculates account health score based on multiple dimensions including owner assignment, contacts, opportunities, recent activities, and revenue data.

\`\`\`javascript
// Account health score - Based on multiple indicators
const hasOwner = ctx.record?.owner_id ? 20 : 0;
const hasContacts = ctx.record?.contacts?.length > 0 ? 20 : 0;
const hasOpportunities = ctx.record?.opportunities?.length > 0 ? 20 : 0;
const hasRecentActivity = ctx.record?.updatedAt &&
  (new Date() - new Date(ctx.record.updatedAt)) < 30 * 24 * 60 * 60 * 1000 ? 20 : 0;
const hasRevenue = ctx.record?.annual_revenue > 0 ? 20 : 0;

const score = hasOwner + hasContacts + hasOpportunities + hasRecentActivity + hasRevenue;
const level = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';
const color = score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : score >= 40 ? '#faad14' : '#ff4d4f';

ctx.element.innerHTML = \`
  <div style="display:flex;align-items:center;gap:8px;">
    <div style="position:relative;width:120px;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;">
      <div style="position:absolute;left:0;top:0;height:100%;width:\${score}%;background:\${color};border-radius:4px;transition:width 0.3s;"></div>
    </div>
    <span style="font-size:12px;color:\${color};font-weight:600;">\${score}% \${level}</span>
  </div>
\`;
\`\`\`

## 3. Business Scale Indicator

Shows company scale level and annual revenue with different visual elements for different sizes.

\`\`\`javascript
// Business scale - Employee count and annual revenue combination
const employees = ctx.record?.employees || '';
const revenue = ctx.record?.annual_revenue || 0;

const formatRevenue = (val) => {
  if (val >= 1000000) return \`$\${(val/1000000).toFixed(1)}M\`;
  if (val >= 1000) return \`$\${(val/1000).toFixed(0)}K\`;
  return \`$\${val}\`;
};

const sizeMap = {
  '1-49': { label: 'Small', icon: '●', color: '#1677ff' },
  '50-199': { label: 'Medium', icon: '●●', color: '#faad14' },
  '200-999': { label: 'Large', icon: '●●●', color: '#52c41a' },
  '1000+': { label: 'Enterprise', icon: '●●●●', color: '#eb2f96' }
};

const size = sizeMap[employees] || { label: 'Unknown', icon: '○', color: '#8c8c8c' };

ctx.element.innerHTML = \`
  <div style="display:flex;flex-direction:column;gap:4px;">
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="color:\${size.color};font-size:10px;">\${size.icon}</span>
      <span style="color:#000;font-size:13px;font-weight:500;">\${size.label}</span>
    </div>
    \${revenue > 0 ? \`
      <div style="color:#52c41a;font-size:14px;font-weight:600;">
        \${formatRevenue(revenue)}
      </div>
    \` : '<span style="color:#bfbfbf;font-size:12px;">No revenue data</span>'}
  </div>
\`;
\`\`\`

## 4. Relationship Network Badges

Displays counts of related leads, contacts, and opportunities. Click to show list where titles are clickable to open detail dialogs.

\`\`\`javascript
// Relationship network badges - Using ctx.viewer.drawer, list items clickable
const leads = ctx.record?.leads || [];
const contacts = ctx.record?.contacts || [];
const opportunities = ctx.record?.opportunities || [];

const badges = [
  {
    label: 'Leads',
    type: 'leads',
    count: leads.length,
    color: '#722ed1',
    icon: '👤',
    items: leads,
    dialogUID: 'c4f1bf0165c'  // Contact dialog UID
  },
  {
    label: 'Contacts',
    type: 'contacts',
    count: contacts.length,
    color: '#1677ff',
    icon: '📇',
    items: contacts,
    dialogUID: 'c4f1bf0165c'  // Contact dialog UID
  },
  {
    label: 'Opportunities',
    type: 'opportunities',
    count: opportunities.length,
    color: '#52c41a',
    icon: '💼',
    items: opportunities,
    dialogUID: '44be52bf4bb'  // Opportunity dialog UID
  }
].filter(b => b.count > 0);

ctx.element.innerHTML = \`
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    \${badges.length > 0 ? badges.map((badge, index) => \`
      <a
        href="javascript:void(0)"
        class="badge-link"
        data-index="\${index}"
        style="
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:4px 8px;
          background:\${badge.color}15;
          border-radius:12px;
          text-decoration:none;
          transition:all 0.2s;
          border:1px solid \${badge.color}30;
          cursor:pointer;
        "
        onmouseover="this.style.background='\${badge.color}25';this.style.transform='scale(1.05)'"
        onmouseout="this.style.background='\${badge.color}15';this.style.transform='scale(1)'"
      >
        <span style="font-size:12px;">\${badge.icon}</span>
        <span style="color:\${badge.color};font-size:12px;font-weight:600;">\${badge.count}</span>
        <span style="color:#595959;font-size:11px;">\${badge.label}</span>
      </a>
    \`).join('') : '<span style="color:#bfbfbf;font-size:12px;">No related data</span>'}
  </div>
\`;

// Bind click events
ctx.element.querySelectorAll('.badge-link').forEach((link) => {
  const badgeIndex = parseInt(link.dataset.index);
  const badge = badges[badgeIndex];

  link.addEventListener('click', (e) => {
    e.preventDefault();

    // Prepare detail content
    let detailContent = '';
    const formatValue = (val) => {
      if (val >= 1000000) return \`$\${(val/1000000).toFixed(1)}M\`;
      if (val >= 1000) return \`$\${(val/1000).toFixed(0)}K\`;
      return \`$\${val}\`;
    };

    if (badge.type === 'opportunities') {
      const totalValue = badge.items.reduce((sum, opp) => sum + (opp.amount || 0), 0);

      detailContent = \`
        <div style="padding:16px;">
          <h4 style="margin:0 0 12px;color:#333;">Opportunities List</h4>
          <div style="padding:8px;background:#e6f7ff;border-radius:4px;margin-bottom:12px;">
            <strong>Total Pipeline Value: <span style="color:#52c41a;">\${formatValue(totalValue)}</span></strong>
          </div>
          <div style="max-height:400px;overflow-y:auto;">
            \${badge.items.slice(0, 10).map(opp => \`
              <div style="padding:8px;margin-bottom:8px;background:#f5f5f5;border-radius:4px;">
                <div
                  class="item-title"
                  style="font-weight:500;margin-bottom:4px;color:#1677ff;cursor:pointer;"
                  onmouseover="this.style.textDecoration='underline'"
                  onmouseout="this.style.textDecoration='none'"
                  data-dialog="\${badge.dialogUID}"
                >\${opp.name || 'Unnamed Opportunity'}</div>
                <div style="font-size:12px;color:#8c8c8c;">
                  Amount: <strong style="color:#52c41a;">\${formatValue(opp.amount || 0)}</strong> |
                  Stage: \${opp.stage || 'Unknown'}
                </div>
              </div>
            \`).join('')}
            \${badge.items.length > 10 ? \`
              <div style="padding:8px;text-align:center;color:#8c8c8c;font-size:12px;">
                ...and \${badge.items.length - 10} more opportunities
              </div>
            \` : ''}
          </div>
        </div>
      \`;
    } else {
      // Similar implementation for leads and contacts
      detailContent = \`
        <div style="padding:16px;">
          <h4 style="margin:0 0 12px;color:#333;">\${badge.label} List</h4>
          <div style="max-height:400px;overflow-y:auto;">
            \${badge.items.slice(0, 10).map(item => \`
              <div style="padding:8px;margin-bottom:8px;background:#f5f5f5;border-radius:4px;">
                <div
                  class="item-title"
                  style="font-weight:500;margin-bottom:4px;color:#1677ff;cursor:pointer;"
                >\${item.name || 'Unnamed'}</div>
                <div style="font-size:12px;color:#8c8c8c;">
                  \${item.email || 'No email'} | \${item.phone || 'No phone'}
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
    }

    // Use ctx.viewer.drawer to show content
    const drawer = ctx.viewer.drawer({
      title: \`\${badge.icon} \${badge.label} (\${badge.count})\`,
      content: detailContent,
      width: 500
    });
  });
});
\`\`\`

## 5. Activity Status Indicator

Shows account activity status based on last update time with visual indicators.

\`\`\`javascript
// Activity indicator - Based on last update time
const updatedAt = ctx.record?.updatedAt;
const createdAt = ctx.record?.createdAt;

const getTimeDiff = (date) => {
  const diff = new Date() - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 30) return { text: \`\${Math.floor(days/30)} months ago\`, status: 'inactive' };
  if (days > 0) return { text: \`\${days} days ago\`, status: days > 7 ? 'warning' : 'active' };
  if (hours > 0) return { text: \`\${hours} hours ago\`, status: 'active' };
  return { text: \`\${minutes} minutes ago\`, status: 'active' };
};

const timeInfo = updatedAt ? getTimeDiff(updatedAt) : null;
const statusColors = {
  active: '#52c41a',
  warning: '#faad14',
  inactive: '#ff4d4f'
};

ctx.element.innerHTML = timeInfo ? \`
  <div style="display:flex;align-items:center;gap:6px;">
    <div style="width:8px;height:8px;border-radius:50%;background:\${statusColors[timeInfo.status]};
      \${timeInfo.status === 'active' ? 'animation: pulse 2s infinite;' : ''}"></div>
    <span style="color:#595959;font-size:12px;">Updated \${timeInfo.text}</span>
  </div>
  <style>
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  </style>
\` : '<span style="color:#bfbfbf;font-size:12px;">Never updated</span>';
\`\`\`

## 6. Revenue Potential Progress Bar

Displays annual revenue and potential opportunity value, calculates growth potential. Pipeline value is clickable to open opportunities dialog.

\`\`\`javascript
// Revenue potential - Annual revenue + opportunity value with clickable pipeline
const annualRevenue = ctx.record?.annual_revenue || 0;
const opportunities = ctx.record?.opportunities || [];
const potentialValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
const totalPotential = annualRevenue + potentialValue;
const hasOpportunities = opportunities.length > 0;

const formatCurrency = (val) => {
  if (val >= 1000000) return \`$\${(val/1000000).toFixed(2)}M\`;
  if (val >= 1000) return \`$\${(val/1000).toFixed(1)}K\`;
  return \`$\${val.toFixed(0)}\`;
};

const percentage = annualRevenue > 0 ? Math.min((potentialValue / annualRevenue) * 100, 100) : 0;
const growthColor = percentage > 50 ? '#52c41a' : percentage > 20 ? '#1677ff' : '#faad14';

ctx.element.innerHTML = \`
  <div style="display:flex;flex-direction:column;gap:6px;min-width:150px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:11px;color:#8c8c8c;">Annual Revenue</span>
      <span style="font-size:13px;color:#000;font-weight:600;">\${formatCurrency(annualRevenue)}</span>
    </div>
    \${potentialValue > 0 ? \`
      <div
        class="pipeline-link"
        style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:2px;border-radius:2px;transition:background 0.2s;"
        onmouseover="this.style.background='#f0f5ff'"
        onmouseout="this.style.background='transparent'"
      >
        <span style="font-size:11px;color:#8c8c8c;">Pipeline (\${opportunities.length})</span>
        <span style="font-size:13px;color:\${growthColor};font-weight:600;">+\${formatCurrency(potentialValue)}</span>
      </div>
      <div style="position:relative;width:100%;height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;">
        <div style="position:absolute;left:0;top:0;height:100%;width:\${percentage}%;background:\${growthColor};border-radius:2px;"></div>
      </div>
    \` : ''}
  </div>
\`;

// Add click handler for pipeline link
if (hasOpportunities) {
  const pipelineLink = ctx.element.querySelector('.pipeline-link');
  if (pipelineLink && !pipelineLink._eventBound) {
    pipelineLink._eventBound = true;
    pipelineLink.addEventListener('click', async () => {
      // Open opportunities related to this account
      await ctx.openView('44be52bf4bb', {
        collectionName: 'opportunities',
        dataSourceKey: 'main',
        filterByTk: ctx.record?.id  // Filter opportunities by account_id
      });
    });
  }
}
\`\`\`

## Usage Instructions

### Configuration in NocoBase
1. Navigate to the table configuration interface
2. Add a new column and select "JavaScript" type
3. Paste the corresponding code into the code editor
4. Save and refresh the table to see the effects

### Performance Optimization
- For columns with complex calculations, limit the number of rows displayed per page
- Ensure proper query optimization for columns that need to count related data
- Consider caching results for complex calculations

### Customization Tips
- **Color schemes**: Modify color values to match brand colors
- **Thresholds**: Adjust health score and activity thresholds based on business needs
- **Display formats**: Adjust currency and date formats based on regional preferences
- **Icons**: Replace with other emojis or icon fonts as needed`,
};
