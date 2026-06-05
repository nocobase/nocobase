# Workflow Webhook Integration

Through Webhook triggers, NocoBase can receive HTTP calls from third-party systems and automatically trigger workflows, enabling seamless integration with external systems.

## Overview

Webhooks are a "reverse API" mechanism that allows external systems to proactively send data to NocoBase when specific events occur. Compared to active polling, Webhooks provide a more real-time and efficient integration approach.

## Typical Use Cases

### Form Data Submission

External survey systems, registration forms, and customer feedback forms push data to NocoBase via Webhook after user submission, automatically creating records and triggering follow-up processes (such as sending confirmation emails, assigning tasks, etc.).

### Message Notifications

Events from third-party messaging platforms (such as WeCom, DingTalk, Slack) like new messages, mentions, or approval completions can trigger automated processes in NocoBase through Webhooks.

### Data Synchronization

When data changes in external systems (such as CRM, ERP), Webhooks push updates to NocoBase in real-time to maintain data synchronization.

### Third-Party Service Integration

- **GitHub**: Code pushes, PR creation events trigger automation workflows
- **GitLab**: CI/CD pipeline status notifications
- **Form Submissions**: External form systems submit data to NocoBase
- **IoT Devices**: Device status changes, sensor data reporting

## Features

### Flexible Trigger Mechanism

- Supports GET, POST, PUT, DELETE HTTP methods
- Automatically parses JSON, form data, and other common formats
- Configurable request validation to ensure trusted sources

### Data Processing Capabilities

- Received data can be used as variables in workflows
- Supports complex data transformation and processing logic
- Can be combined with other workflow nodes to implement complex business logic

### Security Assurance

- Supports signature verification to prevent forged requests
- Configurable IP whitelist
- HTTPS encrypted transmission

## Usage Steps

### 1. Install Plugin

Locate and install the **[Workflow: Webhook](/plugins/@nocobase/plugin-workflow-webhook/)** plugin in the plugin manager.

> Note: This is a commercial plugin. For detailed activation instructions, please refer to: [Commercial Plugin Activation Guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide)

### 2. Create Webhook Workflow

1. Navigate to **Workflow Management**
2. Click **Create Workflow**
3. Select **Webhook Trigger** as the trigger type

![Create Webhook Workflow](https://static-docs.nocobase.com/20241210105049.png)

4. Configure Webhook parameters

![Webhook Trigger Configuration](https://static-docs.nocobase.com/20241210105441.png)
   - **Request Path**: Custom Webhook URL path
   - **Request Method**: Select allowed HTTP methods (GET/POST/PUT/DELETE)
   - **Sync/Async**: Choose whether to wait for workflow completion before returning results
   - **Validation**: Configure signature verification or other security mechanisms

### 3. Configure Workflow Nodes

Add workflow nodes based on business requirements, such as:

- **Collection Operations**: Create, update, delete records
- **Conditional Logic**: Branch based on received data
- **HTTP Request**: Call other APIs
- **Notifications**: Send emails, SMS, etc.
- **Custom Code**: Execute JavaScript code

### 4. Obtain Webhook URL

After workflow creation, the system generates a unique Webhook URL, typically in the format:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Configure in Third-Party System

Configure the generated Webhook URL in the third-party system:

- Set data submission callback address in form systems
- Configure Webhook in GitHub/GitLab
- Configure event push address in WeCom/DingTalk

### 6. Test Webhook

Test the Webhook using tools like Postman or cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Accessing Request Data

In workflows, access Webhook data through variables:

- `{{$context.data}}`: Request body data
- `{{$context.headers}}`: Request headers
- `{{$context.query}}`: URL query parameters
- `{{$context.params}}`: Path parameters

![Request Parameters Parsing](https://static-docs.nocobase.com/20241210111155.png)

![Request Body Parsing](https://static-docs.nocobase.com/20241210112529.png)

## Response Configuration

![Response Settings](https://static-docs.nocobase.com/20241210114312.png)

### Synchronous Mode

Returns results after workflow execution completes, configurable:

- **Response Status Code**: 200, 201, etc.
- **Response Data**: Custom JSON response
- **Response Headers**: Custom HTTP headers

### Asynchronous Mode

Returns immediate confirmation, workflow executes in background. Suitable for:

- Long-running workflows
- Scenarios not requiring execution results
- High-concurrency scenarios

## Security Best Practices

### 1. Enable Signature Verification

Most third-party services support signature mechanisms:

```javascript
// Example: Verify GitHub Webhook signature
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Use HTTPS

Ensure NocoBase is deployed with HTTPS to protect data transmission.

### 3. Restrict Request Sources

Configure IP whitelist to allow only trusted sources.

### 4. Data Validation

Add data validation logic in workflows to ensure correct format and valid content.

### 5. Audit Logging

Record all Webhook requests for tracking and troubleshooting.

## Troubleshooting

### Webhook Not Triggering?

1. Verify the Webhook URL is correct
2. Confirm workflow status is "Enabled"
3. Check third-party system's send logs
4. Review firewall and network configuration

### How to Debug Webhooks?

1. Check workflow execution records for detailed information about requests and results
2. Use Webhook testing tools (like Webhook.site) to verify requests
3. Review key data and error messages in execution records

### How to Handle Retries?

Some third-party services retry sending if they don't receive a successful response:

- Ensure workflow is idempotent
- Use unique identifiers for deduplication
- Record processed request IDs

### Performance Optimization Tips

- Use asynchronous mode for time-consuming operations
- Add conditional logic to filter unnecessary requests
- Consider using message queues for high-concurrency scenarios

## Example Scenarios

### External Form Submission Processing

```javascript
// 1. Verify data source
// 2. Parse form data
const formData = context.data;

// 3. Create customer record
// 4. Assign to relevant owner
// 5. Send confirmation email to submitter
if (formData.email) {
  // Send email notification
}
```

### GitHub Code Push Notification

```javascript
// 1. Parse push data
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. If main branch
if (branch === 'main') {
  // 3. Trigger deployment process
  // 4. Notify team members
}
```

![Webhook Workflow Example](https://static-docs.nocobase.com/20241210120655.png)

## Related Resources

- [Workflow Plugin Documentation](/plugins/@nocobase/plugin-workflow/)
- [Workflow: Webhook Trigger](/workflow/triggers/webhook)
- [Workflow: HTTP Request Node](/integration/workflow-http-request/)
- [API Keys Authentication](/integration/api-keys/)
