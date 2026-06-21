---
pkg: '@nocobase/plugin-workflow-mailer'
---

# Send email

## Introduction

Used to send emails. Supports content in text and HTML formats.

## Create node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Send email" node:


![20251031130522](https://static-docs.nocobase.com/20251031130522.png)


## Node configuration


![20251031131125](https://static-docs.nocobase.com/20251031131125.png)


Each option can use variables from the workflow context. For sensitive information, global variables and secrets can also be used.

## FAQ

### Gmail sending frequency limit

When sending some emails, you may encounter the following error:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

This is because Gmail rate-limits sending requests from domains that are not specified. When deploying the application, you need to configure the server's hostname to the domain you have configured in Gmail. For example, in a Docker deployment:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Set to your configured sending domain
```

Reference: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)