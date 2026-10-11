---
title: 'More Mail Features'
description: 'Reuse signatures and templates and handle mail on business pages.'
---

# More Mail Features

Beyond the mail center, reuse signatures and templates or add mail actions to other application pages.

## Use signatures and templates

Signatures add your name, job title, and contact information to the end of a message. Templates reuse common subjects and content. Choose a signature and template while composing, then adjust the message for the conversation to reduce repeated entry.

Open **Signatures** or **Templates** on the mailbox accounts page to maintain your content. For example, a sales representative can reuse a quotation reply template:

```text
Add a signature to my mailbox with my name, job title, and phone number. Create a quotation reply template with product, quantity, unit price, and estimated delivery date. Let me choose a signature and template while composing and edit the details for each quotation.
```

Click **Template** while composing and select the quotation reply template.

After the template fills the subject and quotation details, click **Signature** to choose your signature. After selecting a template, you can edit the message and send it when ready.

## View correspondence on business pages

Embed mail on customer, project, or supplier pages so users can handle related correspondence alongside business information. The application finds relevant messages using contact email addresses or other association rules.

For example, show correspondence on a customer detail page using contact email addresses:

```text
Add a correspondence section to customer details. Show messages whose sender or recipient matches the current customer's contact email addresses. Sales representatives can read messages, view attachments, and reply using their own connected mailboxes.
```

Click a customer name in the customer list to open its details.

The details show customer information and correspondence linked to the contact. Select a message to read the conversation and click **Reply** to respond.

Project and supplier detail pages can also show correspondence matched by contact email.

## Compose from business pages

Add a compose action to a business page and populate recipients, subject, and content from the current record. Users can edit and confirm the message before sending from their own mailbox, reducing copying between pages.

For example, send a progress update from project details:

```text
Add a Send progress email action to project details. Select recipients from project contacts. Include the project name in the subject and the current progress and estimated delivery date in the body. Employees can edit recipients and content and confirm before sending from their own mailbox.
```

Open project details and click **Send progress email**.

The recipient, subject, and body are populated from project information. Employees can edit the content and confirm before sending.

## Usage tips

- Synchronize to retrieve new messages. Refreshing the list displays messages already imported into the application.
- Use search, stars, and labels to organize correspondence. Whether changes reach the provider depends on the integration.
- Choose the history you need when starting the initial synchronization.

For page integration and permissions, see [Developer Reference](./development.md).

## Compose from a Northstar order

Ask the Agent to add **Compose progress email** to the order detail, reading the customer contact and current order fields. The employee reviews recipients and edits the message before sending through their connected account, with existing templates and signatures.

This example shows the actual editor populated from the current transport record before sending. Replace a sample contact with a valid authorized recipient before submission.

![Order data in the mail editor](../assets/northstar-order-mail-en.png)
