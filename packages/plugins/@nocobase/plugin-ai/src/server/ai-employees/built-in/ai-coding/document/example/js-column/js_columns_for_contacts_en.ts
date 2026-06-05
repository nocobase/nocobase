/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js_columns_for_contacts',
  content: String.raw`# NocoBase JS Column Examples - Contacts Table

## Overview
Practical JavaScript column examples for the contacts table in CRM systems. These aggregated columns integrate multiple fields, display relationship networks, and visualize communication history to enhance contact data readability and business value.

## Selected JS Column Examples

## 1. Contact Business Card

Display contact's core information including name, title, department, and company affiliation.

\`\`\`javascript
// Contact business card - Name, title, company, department
const name = ctx.record?.name || 'Unknown';
const title = ctx.record?.title || '';
const department = ctx.record?.department || '';
const account = ctx.record?.account;
const accountName = account?.name || '';
const salutation = ctx.record?.salutation || '';
const email = ctx.record?.email || '';

// Get initials for avatar
const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Generate color based on department
const departmentColors = {
  'Sales': '#52c41a',
  'Marketing': '#1677ff',
  'Engineering': '#722ed1',
  'Support': '#faad14',
  'Finance': '#eb2f96',
  'Human Resources': '#13c2c2',
  'Operations': '#fa8c16'
};

const getDeptColor = (dept) => {
  for (let key in departmentColors) {
    if (dept?.toLowerCase().includes(key.toLowerCase())) {
      return departmentColors[key];
    }
  }
  return '#8c8c8c';
};

const avatarColor = getDeptColor(department);

ctx.element.innerHTML = \`
  <div style="display:flex;align-items:center;gap:12px;">
    <div style="
      width:40px;
      height:40px;
      border-radius:50%;
      background:\${avatarColor};
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:600;
      font-size:14px;
      flex-shrink:0;
    ">
      \${getInitials(name)}
    </div>
    <div style="display:flex;flex-direction:column;min-width:0;">
      <div style="display:flex;align-items:center;gap:6px;">
        \${salutation ? \`<span style="color:#8c8c8c;font-size:12px;">\${salutation}</span>\` : ''}
        <strong style="color:#000;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">\${name}</strong>
      </div>
      \${title || department ? \`
        <div style="color:#595959;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          \${title}\${title && department ? ' · ' : ''}\${department}
        </div>
      \` : ''}
      \${accountName ? \`
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="color:#8c8c8c;font-size:11px;">@</span>
          <a class="account-link" style="
            color:#1677ff;
            font-size:11px;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            cursor:pointer;
            text-decoration:none;
            transition:all 0.2s;
          "
          onmouseover="this.style.textDecoration='underline'"
          onmouseout="this.style.textDecoration='none'"
          >\${accountName}</a>
        </div>
      \` : ''}
    </div>
  </div>
\`;

// Click company name to open account info dialog
if (accountName) {
  ctx.element.querySelector('.account-link')?.addEventListener('click', async () => {
    await ctx.openView('c91bba4e338', {
      title: 'Account Info',
      navigation: false,
    });
  });
}
\`\`\`

## 2. Contact Information Display

Shows all contact methods with quick copy functionality.

\`\`\`javascript
// Contact methods - Email, phone, mobile with quick actions
const email = ctx.record?.email || '';
const phone = ctx.record?.phone || '';
const mobile = ctx.record?.mobile || '';

const contacts = [
  { type: 'email', value: email, icon: '✉️', color: '#1677ff' },
  { type: 'phone', value: phone, icon: '☎️', color: '#52c41a' },
  { type: 'mobile', value: mobile, icon: '📱', color: '#fa8c16' }
].filter(c => c.value);

// Format display text while preserving content
const formatContactDisplay = (type, value) => {
  if (type === 'email') {
    // Show more characters for email
    if (value.length > 25) {
      const [username, domain] = value.split('@');
      if (username.length > 15) {
        return username.substring(0, 15) + '...@' + domain;
      }
      return value;
    }
    return value;
  }
  // Display full phone number
  return value;
};

ctx.element.innerHTML = \`
  <div style="display:flex;gap:6px;flex-wrap:wrap;min-width:200px;">
    \${contacts.length > 0 ? contacts.map(contact => \`
      <a
        href="javascript:void(0)"
        class="contact-btn"
        data-type="\${contact.type}"
        data-value="\${contact.value}"
        title="\${contact.value}"
        style="
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:4px 10px;
          background:\${contact.color}10;
          border:1px solid \${contact.color}30;
          border-radius:4px;
          text-decoration:none;
          transition:all 0.2s;
          cursor:pointer;
          max-width:250px;
        "
      >
        <span style="font-size:12px;flex-shrink:0;">\${contact.icon}</span>
        <span style="
          color:\${contact.color};
          font-size:11px;
          font-weight:500;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        ">
          \${formatContactDisplay(contact.type, contact.value)}
        </span>
      </a>
    \`).join('') : '<span style="color:#bfbfbf;font-size:12px;">No contact info</span>'}
  </div>
\`;

// Bind click to copy functionality
ctx.element.querySelectorAll('.contact-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const value = btn.dataset.value;
    const type = btn.dataset.type;

    // Copy to clipboard
    navigator.clipboard.writeText(value).then(() => {
      ctx.message.success(\`\${type === 'email' ? 'Email' : type === 'phone' ? 'Phone' : 'Mobile'} copied!\`);
    }).catch(() => {
      ctx.message.error('Failed to copy');
    });
  });

  // Hover effect
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-1px)';
    btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = 'none';
  });
});
\`\`\`

## 3. Activity Metrics Dashboard

Calculates interaction frequency based on tasks, events, and last update time.

\`\`\`javascript
// Activity metrics - Activity frequency and last interaction
// Note: Include tasks, events and contact_comments relations in query
const tasks = ctx.record?.tasks || ctx.record?.campaign_tasks || [];
const events = ctx.record?.events || [];
const comments = ctx.record?.contact_comments || [];
const updatedAt = ctx.record?.updatedAt;

// Show all data without time filtering
const totalTasks = tasks.length;
const totalEvents = events.length;
const totalComments = comments.length;
const totalActivities = totalTasks + totalEvents + totalComments;

// Calculate activity level
const activityLevel = totalActivities >= 10 ? 'Very Active' :
                     totalActivities >= 5 ? 'Active' :
                     totalActivities >= 1 ? 'Low Activity' :
                     'Inactive';

const levelColors = {
  'Very Active': '#52c41a',
  'Active': '#1677ff',
  'Low Activity': '#faad14',
  'Inactive': '#ff4d4f'
};

// Calculate last interaction
const getLastInteraction = () => {
  if (!updatedAt) return 'Never contacted';
  const diff = new Date() - new Date(updatedAt);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days > 30) return \`\${Math.floor(days/30)} months ago\`;
  if (days > 0) return \`\${days} days ago\`;
  if (hours > 0) return \`\${hours} hours ago\`;
  return 'Just now';
};

const levelColor = levelColors[activityLevel];

ctx.element.innerHTML = \`
  <div style="display:flex;flex-direction:column;gap:6px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="
          width:8px;
          height:8px;
          border-radius:50%;
          background:\${levelColor};
          \${activityLevel === 'Very Active' ? 'animation: pulse 2s infinite;' : ''}
        "></div>
        <span style="color:\${levelColor};font-size:12px;font-weight:600;">\${activityLevel}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-left:auto;">
        <span style="color:#bfbfbf;font-size:10px;">Last update:</span>
        <span style="color:#8c8c8c;font-size:11px;">\${getLastInteraction()}</span>
      </div>
    </div>

    <div style="display:flex;gap:4px;">
      <div style="flex:1;text-align:center;padding:4px 0;border-right:1px solid #f0f0f0;">
        <div style="color:#595959;font-size:16px;font-weight:600;">\${totalTasks}</div>
        <div style="color:#8c8c8c;font-size:10px;">Tasks</div>
      </div>
      <div style="flex:1;text-align:center;padding:4px 0;border-right:1px solid #f0f0f0;">
        <div style="color:#595959;font-size:16px;font-weight:600;">\${totalEvents}</div>
        <div style="color:#8c8c8c;font-size:10px;">Events</div>
      </div>
      <div style="flex:1;text-align:center;padding:4px 0;">
        <div style="color:#595959;font-size:16px;font-weight:600;">\${totalComments}</div>
        <div style="color:#8c8c8c;font-size:10px;">Comments</div>
      </div>
    </div>

    <div style="position:relative;height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;">
      <div style="
        position:absolute;
        left:0;
        top:0;
        height:100%;
        width:\${Math.min(totalActivities * 10, 100)}%;
        background:\${levelColor};
        border-radius:2px;
        transition:width 0.3s;
      "></div>
    </div>
  </div>

  <style>
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  </style>
\`;
\`\`\`

## Usage Instructions

### Configuration in NocoBase
1. Navigate to the contacts table configuration interface
2. Add a new column and select "JavaScript" type
3. Paste the corresponding code into the code editor
4. Save and refresh the table to see the effects

### Data Dependencies
- **Related data**: Properly configure account, owner, reports_to, opportunities, tasks, events, tags relations
- **Null handling**: All code includes null checks to prevent errors with missing data
- **Performance**: For columns with many related data, limit rows per page

### Customization Tips
- **Color theme**: Adjust to match brand color #1677ff
- **Display limits**: Adjust the number of tags, tasks, events shown
- **Time format**: Adjust date/time display based on regional preferences
- **Icon style**: Replace with other emojis or icon fonts as needed`,
};
