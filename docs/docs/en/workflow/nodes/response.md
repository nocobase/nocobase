---
pkg: "@nocobase/plugin-workflow-response-message"
---

# HTTP Response

## Introduction

This node is only supported in synchronous Webhook workflows and is used to return a response to a third-party system. For example, during the processing of a payment callback, if the business process has an unexpected result (such as an error or failure), you can use the response node to return an error response to the third-party system, so that some third-party systems can retry later based on the status.

Additionally, the execution of the response node will terminate the workflow's execution, and subsequent nodes will not be executed. If no response node is configured in the entire workflow, the system will automatically respond based on the flow's execution status: returning `200` for successful execution and `500` for failed execution.

## Creating a Response Node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Response" node:


![20241210115120](https://static-docs.nocobase.com/20241210115120.png)


## Response Configuration


![20241210115500](https://static-docs.nocobase.com/20241210115500.png)


You can use variables from the workflow context in the response body.