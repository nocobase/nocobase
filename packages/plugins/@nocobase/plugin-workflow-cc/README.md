# @nocobase/plugin-workflow-cc

<video width="100%" controls>
      <source src="https://static-docs.nocobase.com/NocoBase0510.mp4" type="video/mp4">
</video>


## What is NocoBase

NocoBase is a scalability-first, open-source no-code development platform.  
Instead of investing years of time and millions of dollars in research and development, deploy NocoBase in a few minutes and you'll have a private, controllable, and extremely scalable no-code development platform!

Homepage:  
https://www.nocobase.com/

Online Demo:  
https://demo.nocobase.com/new

Documents:  
https://docs.nocobase.com/

Commericial license & plugins:  
https://www.nocobase.com/en/commercial

License agreement:   
https://www.nocobase.com/en/agreement


## Contact Us:  
hello@nocobase.com

## CC task API notes

- `/api/workflowCcTasks:listMine` may include temporary association fields when a CC task card uses them.
- Temporary association field configuration is stored in the CC node config under `tempAssociationFields`.
- Field configuration entries contain `nodeId`, `nodeKey`, and `nodeType`.
- Field names are derived at runtime from `nodeKey` (shared builder on client and server).
- Fields are auto-synced when users add or remove fields in task cards.
- Existing CC nodes populate `tempAssociationFields` after opening and saving task card settings.
- Only upstream nodes that expose `useTempAssociationSource` are eligible for temporary association fields.
