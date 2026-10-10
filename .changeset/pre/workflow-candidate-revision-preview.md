---
'@nocobase/app-plugin-dag-flow': minor
---

Let a candidate workflow revision be read before it is enabled

A deployed Artifact only becomes a revision row when something enables or runs it, and `revisions()` listed rows. So the version picker on a workflow's page offered only the revision already running, and the candidate revision reported next to it as `pendingArtifact` had no entry at all: the only way to see what the new version contained was to press "Enable new version", which is precisely the decision the reading was meant to inform.

`revisions()` now also returns any deployed Artifact for that key with no row yet, addressed by its Artifact hash with a null id and a null version. Reading one writes nothing — `GET /workflows/<hash>` already resolves an unmaterialized Artifact from discovery — so a candidate revision can be opened, read, and left alone.

The picker on the page follows: it lists the candidate as "Unpublished" and loads its options with the definition rather than when the picker is opened, because a native select renders its options as the popup opens and options arriving later stay invisible until the next open. A revision another revision has superseded is marked as not the running version and offers "Enable this version" in place of the enable/disable switch, which describes swapping the running version rather than turning the workflow off and on. The "New version available" badge in the workflow list links to the candidate as well.

`GET /workflows/<hash>` for an unmaterialized Artifact also reports the execution count for its key, which it previously reported as zero while every other revision of the same workflow reported the real count.
