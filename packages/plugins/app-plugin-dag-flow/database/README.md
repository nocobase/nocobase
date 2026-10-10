# Workflow database

The workflow plugin owns the `202608200001_create_workflow_collections`
migration. Apps that enable this plugin discover it through the plugin
database manifest; the migration must not be copied into an app template.
