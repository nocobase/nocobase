---
pkg: '@nocobase/plugin-ai'
title: 'AI Employee Skills'
description: 'Skills are domain-specific knowledge guides for AI Employees: General skills and Employee-specific skills.'
keywords: 'AI Employee skills,Skills,NocoBase'
---

# Using Skills

Skills are domain-specific knowledge guides provided to AI Employees, guiding them to use multiple tools to handle tasks in specialized domains.

Currently, skills do not support customization and are only provided as system presets.

## Skill Structure

The Skills page is divided into two categories:

1. `General skills`: shared by all AI Employees, usually read-only.
2. `Employee-specific skills`: exclusive to the current employee.

![](https://static-docs.nocobase.com/202604230832639.png)

## Skill Descriptions

### General Skills

| Skill Name | Description |
| --- | --- |
| Data metadata | Retrieves system data models, collection and field metadata to help AI Employees understand business context. |
| Data query | Queries data from collections with support for conditional filtering, aggregate queries, and more to help AI Employees access business data. |
| Business analysis report | Generates analysis reports based on business data with support for multi-dimensional analysis and visualization to help AI Employees perform business insights. |
| Document search | Searches and reads preset document content to help AI Employees complete document-based work, currently mainly for writing JS code. |

### Employee-specific Skills

| Skill Name | Description | Employee |
| --- | --- | --- |
| Data modeling | Data modeling skill for understanding and building business data models | Orin |
| Frontend developer | Writing and testing JS code for frontend blocks | Nathan |
