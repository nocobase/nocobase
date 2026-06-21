# Lead Follow-up & Status Management

## 1. Introduction

### 1.1 Chapter Objective

In this chapter, we will learn how to implement CRM lead conversion in NocoBase. Through lead follow-up and status management, you can boost operational efficiency and achieve more refined sales process control.

### 1.2 Preview of the Final Outcome

In the previous chapter, we explained how to associate data between leads and the Company, Contact, and Opportunity collections. Now, we focus on the Lead module, primarily discussing how to perform lead follow-up and status management. Please watch the following demo:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Structure of the Lead Collection

### 2.1 Introduction to the Lead Collection

In the lead follow-up functionality, the "status" field plays a crucial role. It not only reflects the current progress of the lead (e.g., Unqualified, New, Working, Nurturing, In Transaction, Completed) but also drives the dynamic display and changes of the form. The following table block shows the field structure of the Lead collection along with its detailed description:


| Field name     | Display Name       | Field Interface  | Description                                                                           |
| -------------- | ------------------ | ---------------- | ------------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | Primary key                                                                           |
| account_id     | **account_id**     | Integer          | Foreign key of the ACCOUNT collection                                                 |
| contact_id     | **contact_id**     | Integer          | Foreign key of the CONTACT collection                                                 |
| opportunity_id | **opportunity_id** | Integer          | Foreign key of the OPPORTUNITY collection                                             |
| name           | **Lead Name**      | Single line text | Name of the prospective customer                                                      |
| company        | **Company Name**   | Single line text | Name of the prospective customer's company                                            |
| email          | **Email**          | Email            | Email address of the prospective customer                                             |
| phone          | **Contact Number** | Phone            | Contact number                                                                        |
| status         | **Status**         | Single select    | Current lead status (Unqualified, New, Working, Nurturing, In Transaction, Completed) |
| Account        | **Company**        | Many to one      | Linked to the Company collection                                                      |
| Contact        | **Contact**        | Many to one      | Linked to the Contact collection                                                      |
| Opportunity    | **Opportunity**    | Many to one      | Linked to the Opportunity collection                                                  |

## 3. Creating the Leads Table Block and Detail Block

### 3.1 Instructions for Creation

First, we need to create a "Leads" table block to display the necessary fields. At the same time, configure a detail block on the right side of the page so that when you click on a record, the corresponding details are automatically displayed. Please refer to the demo below:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Configuring Action Buttons

### 4.1 Overall Description of the Buttons

To meet various operational needs, we need to create a total of 11 buttons. Each button will display differently (hidden, active, or disabled) based on the record's status, guiding the user through the correct business process.
![](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 Detailed Configuration for Each Function Button

#### 4.2.1 Edit Button

- Linkage Rule: When the record's status is "Completed", this button is automatically disabled to prevent unnecessary editing.

#### 4.2.2 Unqualified Button 1 (Inactive)

- Appearance: The title is displayed as "Unqualified >".
- Operation: On click, execute an update operation that sets the record's status to "Unqualified". Upon successful update, return to the previous page and display a success message for "Unqualified".
- Linkage Rule: Displayed only when the record's status is empty; once a status is set, the button is automatically hidden.

#### 4.2.3 Unqualified Button 2 (Active)

- Appearance: Also displayed as "Unqualified >".
- Operation: Used to update the record's status to "Unqualified".
- Linkage Rule: Hidden when the status is empty; if the status is "Completed", the button is disabled.

#### 4.2.4 New Button 1 (Inactive)

- Appearance: The title is displayed as "New >".
- Operation: On click, update the record by setting the status to "New" and, upon success, display a "New" success message.
- Linkage Rule: If the record's status is already "New", "Working", "Nurturing", or "Completed", the button is hidden.

#### 4.2.5 New Button 2 (Active)

- Appearance: The title remains "New >".
- Operation: Also used to update the record's status to "New".
- Linkage Rule: Hidden when the status is "Unqualified" or empty; if the status is "Completed", the button is disabled.

#### 4.2.6 Working Button (Inactive)

- Appearance: The title is displayed as "Working >".
- Operation: On click, update the record's status to "Working" and display a "Working" success message.
- Linkage Rule: If the record's status is already "Working", "Nurturing", or "Completed", the button is hidden.

#### 4.2.7 Working Button (Active)

- Appearance: The title remains "Working >".
- Operation: Used to update the record's status to "Working".
- Linkage Rule: Hidden when the status is "Unqualified", "New", or empty; if the status is "Completed", the button is disabled.

#### 4.2.8 Nurturing Button (Inactive)

- Appearance: The title is displayed as "Nurturing >".
- Operation: On click, update the record's status to "Nurturing" and display a "Nurturing" success message.
- Linkage Rule: If the record's status is already "Nurturing" or "Completed", the button is hidden.

#### 4.2.9 Nurturing Button (Active)

- Appearance: The title remains "Nurturing >".
- Operation: Also used to update the record's status to "Nurturing".
- Linkage Rule: Hidden when the status is "Unqualified", "New", "Working", or empty; if the status is "Completed", the button is disabled.

#### 4.2.10 Transfer Button

- Appearance: The title is displayed as "transfer" and opens in a modal window.
- Operation: Mainly used to execute the record transfer operation. After the update, the system will display an interface with a drawer, tabs, and a form to facilitate the transfer.
- Linkage Rule: When the record's status is "Completed", this button is hidden to prevent duplicate transfers.
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 Transferred Button (Active)

- Appearance: The title is displayed as "transfered" and also opens in a modal window.
- Operation: This button is only used to display information after the transfer is completed and does not allow editing.
- Linkage Rule: Displayed only when the record's status is "Completed"; it is hidden for statuses such as "Unqualified", "New", "Working", "Nurturing", or when empty.
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 Summary of Button Configurations

- Each function provides different button styles for inactive and active states.
- Linkage rules dynamically control the display (hidden or disabled) of the buttons based on the record's status, guiding sales personnel to follow the correct workflow.

## 5. Form Linkage Rule Settings

### 5.1 Rule 1: Display Only the Name

- When the record is not confirmed or the status is empty, only the name is displayed.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Rule 2: Optimized Display Under "New" Status

- When the status is "New", the company name is hidden and the contact information is displayed.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Page Markdown Rules and Handlebars Syntax

### 6.1 Dynamic Text Display

In the page, we use Handlebars syntax to dynamically display different prompt messages based on the record's status. Below are example codes for each status:

When the status is "Unqualified":

```markdown
{{#if (eq $nRecord.status "Unqualified")}}
**Track the details of your unqualified leads.**  
If your lead is not interested in the product or has left the related company, it might be unqualified.  
- Record lessons learned for future reference  
- Save outreach details and contact information  
{{/if}}
```

When the status is "New":

```markdown
{{#if (eq $nRecord.status "New")}}
**Identify the products or services required for this opportunity.**  
- Gather customer cases, reference materials, or competitor analyses  
- Confirm your key stakeholders  
- Determine available resources  
{{/if}}
```

When the status is "Working":

```markdown
{{#if (eq $nRecord.status "Working")}}
**Deliver your solution to stakeholders.**  
- Communicate the value of your solution  
- Clarify timelines and budgets  
- Develop a plan with the customer on when and how to close the deal  
{{/if}}
```

When the status is "Nurturing":

```markdown
{{#if (eq $nRecord.status "Nurturing")}}
**Determine the customer's project implementation plan.**  
- Reach agreements as needed  
- Follow the internal discount process  
- Obtain a signed contract  
{{/if}}
```

When the status is "Completed":

```markdown
{{#if (eq $nRecord.status "Completed")}}
**Confirm the project implementation plan and final steps.**  
- Ensure all remaining agreements and sign-off procedures are in place  
- Adhere to the internal discount policy  
- Ensure the contract is signed and the project proceeds as planned  
{{/if}}
```

## 7. Displaying Associated Objects and Jump Links After Conversion

### 7.1 Description of Associated Objects

After conversion, we want to display the associated objects (Company, Contact, Opportunity) along with links to their detail pages. Note: In other pop-ups or pages, the last part of the detail link (after filterbytk) represents the current object's id. For example:

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 Generating Associated Links Using Handlebars

For Company:

```markdown
{{#if (eq $nRecord.status "Completed")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

For Contact:

```markdown
{{#if (eq $nRecord.status "Completed")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

For Opportunity:

```markdown
{{#if (eq $nRecord.status "Completed")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Hiding Associated Objects but Retaining Their Values

To ensure that associated information is displayed properly after conversion, the statuses for "Company", "Contact", and "Opportunity" should be set to "hidden (retain value)". This way, even though these fields are not shown on the form, their values are still recorded and passed along.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Preventing Status Modification After Conversion

To prevent accidental changes to the status after conversion, we add a condition to all buttons: when the status is "Completed", all buttons will be disabled.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Conclusion

After completing all of the above steps, your lead follow-up conversion functionality is complete! Through this step-by-step guide, we hope you have gained a clearer understanding of how status-based form dynamics and linkages are implemented in NocoBase. Wishing you smooth operations and an enjoyable experience!


```
