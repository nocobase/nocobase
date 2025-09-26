/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js_columns_for_opportunities',
  content: String.raw`# NocoBase JS Column Examples - Opportunities Table

## Overview
Practical JavaScript column examples for the opportunities table in CRM systems. These aggregated columns integrate sales stages, amount forecasting, and close probability to enhance opportunity management efficiency.

## Selected JS Column Examples

## 1. Opportunity Overview Card

Displays opportunity name, amount, and current stage with highlighted key information.

\`\`\`javascript
// Opportunity overview card - Name, amount, stage
const name = ctx.record?.name || 'Unnamed Opportunity';
const amount = ctx.record?.amount || 0;
const stage = ctx.record?.stage || 'Initial Contact';
const probability = (ctx.record?.probability || 0) * 100; // Database stores as decimal, multiply by 100 for display

// Stage color configuration
const stageColors = {
  'Initial Contact': '#1677ff',
  'Needs Analysis': '#722ed1',
  'Solution Development': '#13c2c2',
  'Proposal & Negotiation': '#faad14',
  'Contract Review': '#fa8c16',
  'New Order': '#eb2f96',
  'Win': '#52c41a',
  'Lost': '#ff4d4f'
};

const stageColor = stageColors[stage] || '#8c8c8c';
const isWon = stage === 'Win';
const isLost = stage === 'Lost';

// Simple formatting function
const formatCurrency = (value) => {
  if (value >= 1000000) return \`$\${(value/1000000).toFixed(1)}M\`;
  if (value >= 1000) return \`$\${(value/1000).toFixed(0)}K\`;
  return \`$\${value.toFixed(0)}\`;
};

ctx.element.innerHTML = \`
  <div style="
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 0;
  ">
    <div style="
      font-size: 12px;
      font-weight: 500;
      color: #000;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    " title="\${name}">
      \${name}
    </div>
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <span style="
        font-size: 14px;
        font-weight: 600;
        color: \${isLost ? '#999' : '#000'};
        \${isLost ? 'text-decoration: line-through;' : ''}
      ">
        \${formatCurrency(amount)}
      </span>
      \${probability > 0 && !isWon && !isLost ? \`
        <span style="
          color: #666;
          font-size: 10px;
        ">
          \${Math.round(probability)}%
        </span>
      \` : ''}
    </div>
    <div style="
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      background: \${stageColor}15;
      color: \${stageColor};
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      align-self: flex-start;
    ">
      \${stage}
    </div>
  </div>
\`;
\`\`\`

## 2. Close Date Tracker

Monitors opportunity's expected close date and urgency level.

\`\`\`javascript
// Close date tracker
const closeDate = ctx.record?.close_date;
const stage = ctx.record?.stage || 'Initial Contact';
const createdAt = ctx.record?.createdAt;
const amount = ctx.record?.amount || 0;

// Calculate opportunity age
const getOpportunityAge = () => {
  if (!createdAt) return null;
  const age = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  return age;
};

// Calculate days to close
const getDaysToClose = () => {
  if (!closeDate) return null;
  const days = Math.ceil((new Date(closeDate) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
};

// Get urgency status
const getUrgencyStatus = () => {
  const daysToClose = getDaysToClose();
  const age = getOpportunityAge();

  if (stage === 'Win' || stage === 'Lost') {
    return {
      status: stage === 'Win' ? 'Closed Won' : 'Closed Lost',
      color: stage === 'Win' ? '#52c41a' : '#8c8c8c'
    };
  }

  if (!closeDate) {
    if (age > 90) return { status: 'Stalled', color: '#ff4d4f' };
    if (age > 60) return { status: 'Slow Progress', color: '#faad14' };
    return { status: 'Active', color: '#1677ff' };
  }

  if (daysToClose < 0) return { status: 'Overdue', color: '#ff4d4f' };
  if (daysToClose <= 7) return { status: 'This Week', color: '#fa8c16' };
  if (daysToClose <= 30) return { status: 'This Month', color: '#faad14' };
  if (daysToClose <= 90) return { status: 'This Quarter', color: '#1677ff' };
  return { status: 'Future', color: '#52c41a' };
};

const urgency = getUrgencyStatus();
const daysToClose = getDaysToClose();
const age = getOpportunityAge();

// Simple formatting function
const formatCurrency = (value) => {
  if (value >= 1000000) return \`$\${(value/1000000).toFixed(1)}M\`;
  if (value >= 1000) return \`$\${(value/1000).toFixed(0)}K\`;
  return \`$\${value.toFixed(0)}\`;
};

ctx.element.innerHTML = \`
  <div style="
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 0;
  ">
    <div style="
      display: flex;
      align-items: center;
      gap: 6px;
    ">
      <span style="
        color: \${urgency.color};
        font-size: 12px;
        font-weight: 500;
      ">
        \${urgency.status}
      </span>
      \${daysToClose !== null && daysToClose > 0 ? \`
        <span style="color: #666; font-size: 11px;">
          (\${daysToClose}d)
        </span>
      \` : ''}
    </div>

    \${closeDate && stage !== 'Win' && stage !== 'Lost' ? \`
      <div style="
        color: #666;
        font-size: 11px;
      ">
        Close: \${new Date(closeDate).toLocaleDateString()}
      </div>
    \` : ''}

    \${age !== null ? \`
      <div style="
        color: #999;
        font-size: 10px;
      ">
        Age: \${
          age === 0 ? 'New' :
          age < 30 ? \`\${age}d\` :
          age < 90 ? \`\${Math.floor(age/30)}mo\` :
          \`\${Math.floor(age/30)}mo\`
        }
        \${amount > 0 ? \` • \${formatCurrency(amount)}\` : ''}
      </div>
    \` : ''}
  </div>
\`;
\`\`\`

## Usage Instructions

### Configuration in NocoBase
1. Navigate to the opportunities table configuration interface
2. Add a new column and select "JavaScript" type
3. Paste the corresponding code into the code editor
4. Save and refresh the table to see the effects

### Data Dependencies
- **Base fields**: name, amount, stage, probability
- **Date fields**: close_date, createdAt
- **Related fields**: account, contact, owner
- **Extended fields**: expected_revenue, lead_source, stage_sort

### Performance Optimization
- Cache results for complex calculations like scoring
- Query only necessary fields for related data
- Consider pagination or virtual scrolling for large datasets

### Customization Tips
- **Stage management**: Ensure sales stages are clearly defined with proper flow rules
- **Probability settings**: Establish default stage-to-probability mappings
- **Amount accuracy**: Update opportunity amounts promptly for accurate forecasting
- **Close dates**: Set reasonable expected close dates for priority management
- **Scoring system**: Adjust score weights based on business characteristics`,
};
