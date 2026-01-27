---
pkg: "@nocobase/plugin-comments"
---

# Comment Collection

## Introduction

Comment collection is a specialized data table template designed for storing user comments and feedback. With the comment feature, you can add commenting capabilities to any data table, allowing users to discuss, provide feedback, or annotate specific records. The comment collection supports rich text editing, providing flexible content creation capabilities.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Features

- **Rich Text Editing**: Includes Markdown (vditor) editor by default, supporting rich text content creation
- **Link to Any Data Table**: Can associate comments with records in any data table through relationship fields
- **Multi-level Comments**: Supports replying to comments, building a comment tree structure
- **User Tracking**: Automatically records comment creator and creation time

## User Guide

### Creating a Comment Collection

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Go to the data table management page
2. Click the "Create Collection" button
3. Select the "Comment Collection" template
4. Enter the table name (e.g., "Task Comments", "Article Comments", etc.)
5. The system will automatically create a comment table with the following default fields:
   - Comment content (Markdown vditor type)
   - Created by (linked to user table)
   - Created at (datetime type)

### Configuring Relationships

To link comments to a target data table, you need to configure relationship fields:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Add a "Many-to-One" relationship field in the comment table
2. Select the target data table to link to (e.g., tasks table, articles table, etc.)
3. Set the field name (e.g., "Belongs to Task", "Belongs to Article", etc.)

### Using Comment Blocks on Pages

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Go to the page where you want to add comment functionality
2. Add a block in the details or popup of the target record
3. Select the "Comments" block type
4. Choose the comment collection you just created


### Typical Use Cases

- **Task Management Systems**: Team members discuss and provide feedback on tasks
- **Content Management Systems**: Readers comment and interact with articles
- **Approval Workflows**: Approvers annotate and provide opinions on application forms
- **Customer Feedback**: Collect customer reviews of products or services

## Notes

- Comment collection is a commercial plugin feature and requires the comments plugin to be enabled
- It's recommended to set appropriate permissions for the comment table to control who can view, create, and delete comments
- For scenarios with a large number of comments, it's recommended to enable pagination for better performance
