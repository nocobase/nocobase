# Maintenance Procedures

## Initial Application Startup

When starting the application for the first time, start one node first. Wait for the plugins to be installed and enabled, then start the other nodes.

## Version Upgrade

When you need to upgrade the NocoBase version, follow this procedure.

:::warning{title=Note}
In a cluster **production environment**, features like plugin management and version upgrades should be used with caution or prohibited.

NocoBase does not currently support online upgrades for cluster versions. To ensure data consistency, external services need to be suspended during the upgrade process.
:::

Steps:

1.  Stop the current service

    Stop all NocoBase application instances and forward the load balancer traffic to a 503 status page.

2.  Back up data

    Before upgrading, it is strongly recommended to back up the database to prevent any issues during the upgrade process.

3.  Update the version

    Refer to [Docker Upgrade](../get-started/upgrading/docker) to update the NocoBase application image version.

4.  Start the service

    1. Start one node in the cluster and wait for the update to complete and the node to start successfully.
    2. Verify that the functionality is correct. If there are any issues that cannot be resolved through troubleshooting, you can roll back to the previous version.
    3. Start the other nodes.
    4. Redirect the load balancer traffic to the application cluster.

## In-app Maintenance

In-app maintenance refers to performing maintenance-related operations while the application is running, including:

* Plugin management (installing, enabling, disabling plugins, etc.)
* Backup & Restore
* Environment Migration Management

Steps:

1.  Scale down nodes

    Reduce the number of running application nodes in the cluster to one, and stop the service on the other nodes.

2.  Perform in-app maintenance operations, such as installing and enabling plugins, backing up data, etc.

3.  Restore nodes

    After the maintenance operations are complete and functionality is verified, start the other nodes. Once the nodes have started successfully, restore the cluster's operational state.