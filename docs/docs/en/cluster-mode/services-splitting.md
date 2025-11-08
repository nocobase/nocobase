# Service Splitting <Badge>v1.9.0+</Badge>

## Introduction

Typically, all services of a NocoBase application run in the same Node.js instance. As the functionality within the application becomes more complex with business growth, some time-consuming services may affect overall performance.

To improve application performance, NocoBase supports splitting application services to run on different nodes in cluster mode. This prevents performance issues of a single service from affecting the entire application's ability to respond to user requests.

On the other hand, it also allows for targeted horizontal scaling of specific services, improving the resource utilization of the cluster.

When deploying NocoBase in a cluster, different services can be split and deployed to run on different nodes. The following diagram illustrates the split structure:


![20250803214857](https://static-docs.nocobase.com/20250803214857.png)


## Which Services Can Be Split

### Asynchronous Workflow

**Service KEY**: `workflow:process`

Workflows in asynchronous mode will be enqueued for execution after being triggered. These workflows can be considered background tasks, and users usually do not need to wait for the results to be returned. Especially for complex and time-consuming processes with a high trigger volume, it is recommended to split them to run on independent nodes.

### Other User-level Asynchronous Tasks

**Service KEY**: `async-task:process`

This includes tasks created by user actions such as asynchronous import and export. In cases of large data volumes or high concurrency, it is recommended to split them to run on independent nodes.

## How to Split Services

Splitting different services to different nodes is achieved by configuring the `WORKER_MODE` environment variable. This environment variable can be configured according to the following rules:

- `WORKER_MODE=<empty>`: When not configured or set to empty, the worker mode is the same as the current single-instance mode, accepting all requests and processing all tasks. This is compatible with applications that were not previously configured.
- `WORKER_MODE=!`: The worker mode is to only process requests and not any tasks.
- `WORKER_MODE=workflow:process,async-task:process`: Configured with one or more service identifiers (separated by commas), the worker mode is to only process tasks for these identifiers and not process requests.
- `WORKER_MODE=*`: The worker mode is to process all background tasks, regardless of the module, but not process requests.
- `WORKER_MODE=!,workflow:process`: The worker mode is to process requests and simultaneously process tasks for a specific identifier.
- `WORKER_MODE=-`: The worker mode is to not process any requests or tasks (this mode is required within the worker process).

For example, in a K8S environment, nodes with the same split functionality can use the same environment variable configuration, making it easy to horizontally scale a specific type of service.

## Configuration Examples

### Multiple Nodes with Separate Processing

Suppose there are three nodes: `node1`, `node2`, and `node3`. They can be configured as follows:

- `node1`: Only processes user UI requests, configure `WORKER_MODE=!`.
- `node2`: Only processes workflow tasks, configure `WORKER_MODE=workflow:process`.
- `node3`: Only processes asynchronous tasks, configure `WORKER_MODE=async-task:process`.

### Multiple Nodes with Mixed Processing

Suppose there are four nodes: `node1`, `node2`, `node3`, and `node4`. They can be configured as follows:

- `node1` and `node2`: Process all regular requests, configure `WORKER_MODE=!`, and have a load balancer automatically distribute requests to these two nodes.
- `node3` and `node4`: Process all other background tasks, configure `WORKER_MODE=*`.

## Developer Reference

When developing business plugins, you can split services that consume significant resources based on the requirements of the scenario. This can be achieved in the following ways:

1. Define a new service identifier, for example, `my-plugin:process`, for environment variable configuration, and provide documentation for it.
2. In the business logic of the plugin's server-side, use the `app.serving()` interface to check the environment and determine whether the current node should provide a specific service based on the environment variable.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// In the plugin's server-side code
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Process the business logic for this service
} else {
  // Do not process the business logic for this service
}
```