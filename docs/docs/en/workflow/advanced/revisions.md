# Version Management

After a configured workflow has been triggered at least once, if you want to modify the workflow's configuration or its nodes, you need to create a new version before making changes. This also ensures that when reviewing the execution history of previously triggered workflows, it will not be affected by future modifications.

On the workflow configuration page, you can view existing workflow versions from the version menu in the upper right corner:


![View workflow versions](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)


In the more actions ("...") menu to its right, you can choose to copy the currently viewed version to a new version:


![Copy workflow to a new version](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)


After copying to a new version, click the "Enable"/"Disable" toggle to switch the corresponding version to the enabled state, and the new workflow version will take effect.

If you need to re-select an old version, switch to it from the version menu, then click the "Enable"/"Disable" toggle again to switch it to the enabled state. The currently viewed version will take effect, and subsequent triggers will execute the process of that version.

When you need to disable the workflow, click the "Enable"/"Disable" toggle to switch it to the disabled state, and the workflow will no longer be triggered.

:::info{title=Tip}
Unlike "Copying" a workflow from the workflow management list, a workflow "copied to a new version" is still grouped under the same workflow set, just distinguished by version. However, copying a workflow is treated as a completely new workflow, unrelated to the versions of the previous workflow, and its execution count will also be reset to zero.
:::