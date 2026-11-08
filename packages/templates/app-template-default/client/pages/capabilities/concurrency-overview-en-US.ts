const concurrencyOverview = {
  current: {
    default: 'Default service',
    adapter: 'Implementation',
    scope: 'Coordination scope',
    namespace: 'Namespace',
    named: 'Other configured services',
    unknown: 'Not available',
    unavailable:
      'The current configuration cannot be read yet. No configuration values have been assumed from the template defaults.',
  },
  actionsTitle: 'Adjust configuration through Agent',
  exampleTitle: 'config.yml example',
  exampleHint:
    'Reference example only. Merge it with the existing configuration instead of replacing other services. Restart the application to apply changes.',
  actions: {
    distributed: {
      title: 'Switch to cross-instance coordination',
      description:
        'Use a shared implementation such as Redis when the application runs multiple processes or instances.',
      prompt:
        'Change this application’s concurrency configuration to support coordination across [deployment instances]. Read the installed concurrency plugin Skill and inspect the current configuration. Confirm the compatible shared implementation plugin, its installation or licensing requirements and its own configuration guide; do not assume a Redis plugin is already installed or invent its connection fields. Register the chosen implementation, add a named service with a shared backend and consistent namespace, and use environment variables for credentials. Preserve other named services, explain whether the default service needs to change, and provide a coordinated restart plan so old and new instances do not use separate coordination domains. Limit the change to service configuration; do not add business locking logic or a management UI.',
      inspect:
        'Confirm the target deployment and a compatible shared implementation. If its plugin is absent, check installation requirements before adding and registering it.',
      configure:
        'Follow that implementation’s guide to configure the shared backend, namespace and named service. Store credentials in environment variables. Select it as the default if required.',
      apply:
        'Apply the change through a coordinated restart and confirm the effective configuration on each instance.',
      note: 'Redis is not the built-in mutex. A compatible shared implementation plugin must be installed and registered first. Its own guide defines the connection configuration.',
    },
    independent: {
      title: 'Add an independent concurrency service',
      description:
        'Add a named service with its own namespace while preserving the current default.',
      prompt:
        'Add an independent concurrency service named [service name] with namespace [namespace] to this application. Read the installed concurrency plugin Skill and inspect the existing config.yml, configuration factory and environment overrides. Preserve all existing services and the default selection. If process-local coordination is sufficient, use the built-in mutex with a namespace distinct from other enabled local services. If cross-instance coordination is required, first confirm and configure a compatible shared implementation. Provide the configuration changes and restart steps. This request only adds service configuration; do not modify business code or claim it automatically switches consumers to the new service.',
      inspect:
        'Choose a unique service name and namespace, and confirm whether coordination must span multiple instances.',
      configure:
        'Add the new entry under concurrency and keep the current default. For local mutex services, use different namespaces; adding a local service does not enable cross-instance coordination.',
      apply:
        'Restart the application to apply the configuration. The new service is available for explicit selection; the existing default remains unchanged.',
      note: 'This example adds reports while preserving memory as the default. Replace my-app-reports with a namespace distinct from the application’s other local services.',
    },
    default: {
      title: 'Switch the default service',
      description:
        'Choose an already configured service as the application default.',
      prompt:
        'Switch this application’s default concurrency service to [existing service name]. Read the concurrency plugin Skill and inspect the existing service definitions and any CONCURRENCY_DEFAULT environment override. Confirm that the target service exists, its implementation is registered and its configuration is valid. Preserve all service definitions; update the default selector and any conflicting environment override. Explain the coordination scope of the selected implementation and provide a coordinated restart plan. This changes selection only for consumers that use the default; do not claim it changes explicitly named consumers or introduces concurrency control to every operation.',
      inspect:
        'Confirm that the target service is already declared and that its implementation is available. Check for a CONCURRENCY_DEFAULT override.',
      configure:
        'Change concurrency.default to the target name and align any environment override. Keep the full definitions of the target and all other services.',
      apply:
        'Restart the application to use the new default. Explicitly named services are unaffected.',
      note: 'The standard factory defaults to memory with adapter: mutex. namespace defaults to the application name. This example selects an already configured reports service; it is only a selector fragment, not a complete configuration.',
    },
  },
};

export default concurrencyOverview;
