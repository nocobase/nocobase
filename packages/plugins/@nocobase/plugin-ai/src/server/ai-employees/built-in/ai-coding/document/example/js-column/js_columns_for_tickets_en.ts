/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js_columns_for_tickets',
  content: String.raw`# NocoBase JS Column Examples - Tickets Table

## Overview
Practical JavaScript column examples for the tickets table in ticketing systems. These aggregated columns integrate ticket status, SLA monitoring, and processing progress to enhance ticket management efficiency.

## Selected JS Column Examples

## 1. Ticket Overview Card

Displays ticket subject, priority, and current status with color and icon differentiation for importance.

\`\`\`javascript
// Ticket overview card
const subject = ctx.record?.subject || 'No Subject';
const description = ctx.record?.description || '';
const status = ctx.record?.status || 'New';
const priority = ctx.record?.priority || 'Medium';
const ticketId = ctx.record?.id || '';

// Status configuration
const statusConfig = {
  'New': { color: '#1677ff', icon: '🆕', label: 'New' },
  'Open': { color: '#52c41a', icon: '📂', label: 'Open' },
  'Pending': { color: '#faad14', icon: '⏸️', label: 'Pending' },
  'On Hold': { color: '#fa8c16', icon: '⏳', label: 'On Hold' },
  'Solved': { color: '#13c2c2', icon: '✅', label: 'Solved' },
  'Closed': { color: '#8c8c8c', icon: '🔒', label: 'Closed' }
};

// Priority configuration
const priorityConfig = {
  'Low': { color: '#52c41a', icon: '↓', label: 'Low' },
  'Medium': { color: '#1677ff', icon: '→', label: 'Medium' },
  'High': { color: '#fa8c16', icon: '↑', label: 'High' },
  'Urgent': { color: '#ff4d4f', icon: '⚡', label: 'Urgent' }
};

const statusInfo = statusConfig[status] || statusConfig['New'];
const priorityInfo = priorityConfig[priority] || priorityConfig['Medium'];

// Truncate description to first 50 characters
const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

ctx.element.innerHTML = \`
  <div style="
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 12px;
    background: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  ">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="
          font-size:11px;
          color:#8c8c8c;
          font-family:monospace;
        ">#\${ticketId}</span>
        <span style="
          display:inline-flex;
          align-items:center;
          padding:2px 8px;
          border-radius:4px;
          background:\${priorityInfo.color}20;
          color:\${priorityInfo.color};
          font-size:11px;
          font-weight:500;
        ">
          <span style="margin-right:3px;">\${priorityInfo.icon}</span>
          \${priorityInfo.label}
        </span>
      </div>
      <span style="
        display:inline-flex;
        align-items:center;
        gap:4px;
        padding:3px 8px;
        border-radius:12px;
        background:\${statusInfo.color}15;
        color:\${statusInfo.color};
        font-size:11px;
        font-weight:500;
      ">
        \${statusInfo.icon} \${statusInfo.label}
      </span>
    </div>
    <div style="
      font-weight:500;
      color:#262626;
      font-size:14px;
      margin-bottom:6px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    ">\${subject}</div>
    \${description ? \`
      <div style="
        color:#8c8c8c;
        font-size:12px;
        line-height:1.4;
      ">\${truncateText(description)}</div>
    \` : ''}
  </div>
\`;
\`\`\`

## 2. SLA Monitor Panel

Real-time monitoring of SLA status, showing remaining time and overdue alerts.

\`\`\`javascript
// SLA monitor panel
const techSlaDue = ctx.record?.tech_sla_due;
const salesSlaDue = ctx.record?.sales_sla_due;
const slaPaused = ctx.record?.sla_paused;
const firstResponded = ctx.record?.first_responded_at;
const status = ctx.record?.status;

// Calculate remaining time
const calculateTimeRemaining = (dueDate) => {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;

  if (diff < 0) {
    // Overdue
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
    return {
      isOverdue: true,
      text: hours > 0 ? \`Overdue \${hours}h \${minutes}m\` : \`Overdue \${minutes}m\`,
      color: '#ff4d4f'
    };
  } else {
    // Not overdue
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let color = '#52c41a';
    if (hours < 1) color = '#faad14';
    if (hours < 0.5) color = '#fa8c16';
    return {
      isOverdue: false,
      text: hours > 0 ? \`\${hours}h \${minutes}m left\` : \`\${minutes}m left\`,
      color: color
    };
  }
};

// Check if closed
const isClosed = status === 'Closed' || status === 'Solved';

// Get SLA status
const getSlaStatus = () => {
  if (slaPaused) {
    return { text: 'Paused', color: '#8c8c8c', icon: '⏸️' };
  }
  if (isClosed) {
    return { text: 'Completed', color: '#52c41a', icon: '✅' };
  }
  if (firstResponded) {
    return { text: 'Responded', color: '#13c2c2', icon: '💬' };
  }
  return { text: 'Pending', color: '#1677ff', icon: '⏰' };
};

const techSla = techSlaDue ? calculateTimeRemaining(techSlaDue) : null;
const salesSla = salesSlaDue ? calculateTimeRemaining(salesSlaDue) : null;
const slaStatus = getSlaStatus();

ctx.element.innerHTML = \`
  <div style="
    display:flex;
    flex-direction:column;
    gap:8px;
    padding:8px;
    background:#fafafa;
    border-radius:6px;
  ">
    <div style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding-bottom:6px;
      border-bottom:1px solid #f0f0f0;
    ">
      <span style="
        font-size:11px;
        color:#595959;
        font-weight:500;
      ">SLA Status</span>
      <span style="
        display:inline-flex;
        align-items:center;
        gap:4px;
        padding:2px 6px;
        border-radius:4px;
        background:\${slaStatus.color}15;
        color:\${slaStatus.color};
        font-size:11px;
      ">
        \${slaStatus.icon} \${slaStatus.text}
      </span>
    </div>

    \${techSla ? \`
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;color:#8c8c8c;">Technical</span>
        <span style="
          font-size:11px;
          color:\${techSla.color};
          font-weight:\${techSla.isOverdue ? 'bold' : 'normal'};
        ">
          \${techSla.isOverdue ? '🔴' : '⏱️'} \${techSla.text}
        </span>
      </div>
    \` : ''}

    \${salesSla ? \`
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;color:#8c8c8c;">Sales</span>
        <span style="
          font-size:11px;
          color:\${salesSla.color};
          font-weight:\${salesSla.isOverdue ? 'bold' : 'normal'};
        ">
          \${salesSla.isOverdue ? '🔴' : '⏱️'} \${salesSla.text}
        </span>
      </div>
    \` : ''}

    \${!techSla && !salesSla ? \`
      <div style="
        text-align:center;
        color:#bfbfbf;
        font-size:11px;
        padding:4px;
      ">No SLA configured</div>
    \` : ''}
  </div>
\`;
\`\`\`

## 3. Customer & Product Info Card

Displays related customer, product, and order information.

\`\`\`javascript
// Customer & product info card
const customer = ctx.record?.associated_customer_information;
const product = ctx.record?.product;
const orderNumber = ctx.record?.extracted_order_number;
const serialNumber = ctx.record?.extracted_serial_number;
const model = ctx.record?.extracted_model;

// Get customer name and email
const customerName = customer?.name || 'Unlinked customer';
const customerEmail = customer?.email || '';
const customerPhone = customer?.phone || '';

// Get product info
const productName = product?.name || 'Unlinked product';
const productSku = product?.sku || '';

ctx.element.innerHTML = \`
  <div style="
    border:1px solid #f0f0f0;
    border-radius:8px;
    padding:10px;
    background:white;
  ">
    <div style="margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="font-size:12px;color:#8c8c8c;">👤 Customer:</span>
        <strong style="font-size:13px;color:#262626;">\${customerName}</strong>
      </div>
      \${customerEmail ? \`
        <div style="display:flex;align-items:center;gap:6px;margin-left:20px;">
          <span style="font-size:10px;color:#bfbfbf;">📧</span>
          <a href="mailto:\${customerEmail}" style="
            font-size:11px;
            color:#1677ff;
            text-decoration:none;
          ">\${customerEmail}</a>
        </div>
      \` : ''}
      \${customerPhone ? \`
        <div style="display:flex;align-items:center;gap:6px;margin-left:20px;">
          <span style="font-size:10px;color:#bfbfbf;">📞</span>
          <span style="font-size:11px;color:#595959;">\${customerPhone}</span>
        </div>
      \` : ''}
    </div>

    <div style="
      padding-top:8px;
      border-top:1px solid #fafafa;
    ">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="font-size:12px;color:#8c8c8c;">📦 Product:</span>
        <strong style="font-size:13px;color:#262626;">\${productName}</strong>
        \${productSku ? \`
          <span style="
            font-size:10px;
            color:#8c8c8c;
            padding:1px 4px;
            background:#f5f5f5;
            border-radius:2px;
          ">\${productSku}</span>
        \` : ''}
      </div>

      \${orderNumber || serialNumber || model ? \`
        <div style="
          margin-top:6px;
          padding:4px 6px;
          background:#f5f5f5;
          border-radius:4px;
        ">
          \${orderNumber ? \`
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
              <span style="font-size:10px;color:#8c8c8c;">Order:</span>
              <span style="font-size:11px;color:#262626;font-family:monospace;">\${orderNumber}</span>
            </div>
          \` : ''}
          \${serialNumber ? \`
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
              <span style="font-size:10px;color:#8c8c8c;">Serial:</span>
              <span style="font-size:11px;color:#262626;font-family:monospace;">\${serialNumber}</span>
            </div>
          \` : ''}
          \${model ? \`
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:10px;color:#8c8c8c;">Model:</span>
              <span style="font-size:11px;color:#262626;">\${model}</span>
            </div>
          \` : ''}
        </div>
      \` : ''}
    </div>
  </div>
\`;
\`\`\`

## Usage Instructions

### Configuration in NocoBase
1. Navigate to the tickets table configuration interface
2. Add a new column and select "JavaScript" type
3. Paste the corresponding code into the code editor
4. Save and refresh the table to see the effects

### Data Dependencies
- **Base fields**: subject, description, status, priority
- **SLA fields**: tech_sla_due, sales_sla_due, first_responded_at, sla_paused
- **Time fields**: createdAt, updatedAt, closed_at
- **Related fields**: associated_customer_information, product, assignee_user
- **Extended fields**: problem_type, source, language, satisfaction_survey

### Performance Optimization
- Cache results for complex calculations
- Query only necessary fields for related data
- Consider pagination for large datasets
- Optimize real-time calculations like SLA countdown

### Customization Tips
- **Priority levels**: Adjust priority colors and icons based on business rules
- **SLA thresholds**: Configure warning times based on service level agreements
- **Status workflow**: Ensure status transitions follow business logic
- **Customer info**: Display only essential customer details to maintain privacy
- **Response formats**: Adapt time formats to regional preferences`,
};
