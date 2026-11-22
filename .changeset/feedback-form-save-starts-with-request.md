---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
'@nocobase/app-client': patch
---

A `FeedbackForm` that receives `submitting` now treats only the request as its save, so pressing Escape or closing right after a submit that fails validation still asks "Discard changes?" instead of closing and losing the input. The submission guidance and the runnable list example validate before starting `submission.run`, and ignore a repeated submit until the first one, validation included, has finished, so it cannot save twice.
