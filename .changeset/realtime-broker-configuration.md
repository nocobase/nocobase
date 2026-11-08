---
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
'@nocobase/realtime': patch
---

Group application realtime broker selection and implementation options under realtime.broker, preserving the local default and service-level settings. Reject legacy adapter/redis paths with migration guidance, and validate explicitly configured brokers without filling missing adapters from template defaults. Redis deployments must upgrade the host and matching commercial plugin together and migrate code defaults, YAML, environment mappings and configuration scripts; rollback must restore matching configuration.
