/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js_columns_for_quotations',
  content: String.raw`# NocoBase JS Column Examples - Quotations Table

## Overview
Practical JavaScript column examples for the quotations table in CRM systems. These aggregated columns integrate amount calculations, status workflows, and validity management to enhance quotation management efficiency.

## Selected JS Column Examples

## 1. Quotation Number Card

Displays quotation number, name, and status with highlighted important information.

\`\`\`javascript
// Quotation number card - Code, name, status
const code = ctx.record?.code || 'N/A';
const name = ctx.record?.name || 'Untitled Quote';
const status = ctx.record?.status || 'Draft';

// Status configuration - Minimalist style
const statusConfig = {
  'Draft': { color: '#8c8c8c', label: 'Draft' },
  'Pending Approval': { color: '#faad14', label: 'Pending' },
  'Approved': { color: '#1677ff', label: 'Approved' },
  'Rejected': { color: '#ff4d4f', label: 'Rejected' },
  'Sent to Client': { color: '#13c2c2', label: 'Sent' },
  'Accepted': { color: '#52c41a', label: 'Accepted' }
};

const config = statusConfig[status] || statusConfig['Draft'];

ctx.element.innerHTML = \`
  <div style="
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 0;
  ">
    <div style="
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 12px;
      font-weight: 600;
      color: #000;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    " title="\${code}">
      \${code}
    </div>
    <div style="
      color: #666;
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    " title="\${name}">
      \${name}
    </div>
    <div style="
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      background: \${config.color}15;
      color: \${config.color};
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      align-self: flex-start;
    ">
      \${config.label}
    </div>
  </div>
\`;
\`\`\`

## 2. Amount Summary Panel

Displays detailed fees and total amount with clear price breakdown.

\`\`\`javascript
// Amount summary panel - Display fee breakdown
const subTotal = ctx.record?.sub_total || 0;
const taxAmount = ctx.record?.tax_amount || 0;
const taxRate = ctx.record?.tax_rate || 0;
const shippingHandling = ctx.record?.shipping_handling || 0;
const totalAmount = ctx.record?.total_amount || 0;

// Simple formatting function
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Calculate discount percentage (if any)
const expectedTotal = subTotal + taxAmount + shippingHandling;
const discount = subTotal > 0 && totalAmount < expectedTotal
  ? ((expectedTotal - totalAmount) / subTotal * 100).toFixed(1)
  : 0;

ctx.element.innerHTML = \`
  <div style="
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0;
    min-width: 140px;
  ">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #8c8c8c; font-size: 11px;">Subtotal</span>
      <span style="color: #000; font-size: 11px;">
        \${formatCurrency(subTotal)}
      </span>
    </div>

    \${taxAmount > 0 ? \`
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #8c8c8c; font-size: 11px;">
          Tax\${taxRate > 0 ? \` \${(taxRate * 100).toFixed(1)}%\` : ''}
        </span>
        <span style="color: #595959; font-size: 11px;">
          \${formatCurrency(taxAmount)}
        </span>
      </div>
    \` : ''}

    \${shippingHandling > 0 ? \`
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #8c8c8c; font-size: 11px;">Shipping</span>
        <span style="color: #595959; font-size: 11px;">
          \${formatCurrency(shippingHandling)}
        </span>
      </div>
    \` : ''}

    \${discount > 0 ? \`
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #ff4d4f; font-size: 11px;">Discount</span>
        <span style="color: #ff4d4f; font-size: 11px;">
          -\${discount}%
        </span>
      </div>
    \` : ''}

    <div style="
      border-top: 1px solid #e5e7eb;
      padding-top: 4px;
      margin-top: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span style="color: #000; font-size: 12px; font-weight: 600;">Total</span>
      <span style="
        color: #000;
        font-size: 14px;
        font-weight: 600;
      ">\${formatCurrency(totalAmount)}</span>
    </div>
  </div>
\`;
\`\`\`

## Usage Instructions

### Configuration in NocoBase
1. Navigate to the quotations table configuration interface
2. Add a new column and select "JavaScript" type
3. Paste the corresponding code into the code editor
4. Save and refresh the table to see the effects

### Data Dependencies
- **Amount fields**: Ensure sub_total, tax_amount, shipping_handling, total_amount have correct values
- **Related data**: account, opportunity, contact require proper relationship configuration
- **Date fields**: valid_date for validity calculation
- **Status field**: status for approval workflow display

### Performance Optimization
- Complete amount calculations at database level when possible
- Query only necessary fields for related data
- Consider caching for complex progress bar rendering

### Customization Tips
- **Amount display**: Use internationalized formats, consider different currency requirements
- **Status management**: Clearly define status flow rules
- **Validity reminders**: Set reasonable reminder thresholds
- **Related display**: Show only the most critical related information
- **Responsive design**: Ensure proper display across different screen widths`,
};
