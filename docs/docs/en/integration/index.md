# Integration

## Overview

NocoBase provides comprehensive integration capabilities, allowing seamless connection with external systems, third-party services, and various data sources. Through flexible integration methods, you can extend NocoBase's functionality to meet diverse business needs.

## Integration Methods

### API Integration

NocoBase provides powerful API capabilities for integrating with external applications and services:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API Keys](/integration/api-keys/)**: Secure authentication using API keys for programmatic access to NocoBase resources
- **[API Documentation](/integration/api-doc/)**: Built-in API documentation for exploring and testing endpoints

### Single Sign-On (SSO)

Integrate with enterprise identity systems for unified authentication:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[SSO Integration](/integration/sso/)**: Support for SAML, OIDC, CAS, LDAP, and third-party platform authentication
- Centralized user management and access control
- Seamless authentication experience across systems

### Workflow Integration

Connect NocoBase workflows with external systems:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Workflow Webhook](/integration/workflow-webhook/)**: Receive events from external systems to trigger workflows
- **[Workflow HTTP Request](/integration/workflow-http-request/)**: Send HTTP requests to external APIs from workflows
- Automate business processes across platforms

### External Data Sources

Connect to external databases and data systems:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[External Databases](/data-sources/)**: Directly connect to MySQL, PostgreSQL, MariaDB, MSSQL, Oracle, and KingbaseES databases
- Recognize external database table structures and perform CRUD operations on external data directly within NocoBase
- Unified data management interface

### Embedded Content

Embed external content within NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Iframe Block](/integration/block-iframe/)**: Embed external web pages and applications
- **JS Blocks**: Execute custom JavaScript code for advanced integrations

## Common Integration Scenarios

### Enterprise System Integration

- Connect NocoBase with ERP, CRM, or other enterprise systems
- Synchronize data bidirectionally
- Automate cross-system workflows

### Third-Party Service Integration

- Query payment status from payment gateways, integrate messaging services, or cloud platforms
- Leverage external APIs to extend functionality
- Build custom integrations using webhooks and HTTP requests

### Data Integration

- Connect to multiple data sources
- Aggregate data from different systems
- Create unified dashboards and reports

## Security Considerations

When integrating NocoBase with external systems, consider the following security best practices:

1. **Use HTTPS**: Always use encrypted connections for data transmission
2. **Secure API Keys**: Store API keys securely and rotate them regularly
3. **Principle of Least Privilege**: Grant only necessary permissions for integrations
4. **Audit Logging**: Monitor and log integration activities
5. **Data Validation**: Validate all data from external sources
