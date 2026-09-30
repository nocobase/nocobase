---
'@nocobase/app-skills': patch
---

Forms validate on submit. Guideline T3.3 no longer validates a field as it loses focus, and the handbook and its examples leave `useForm`'s `mode` at the default `'onSubmit'` instead of `'onTouched'`: closing a dialog takes the focus off its field, so a blur-based mode flashed a field error while the dialog closed. After a failed submission a field is still revalidated as it changes, so its error clears once it is corrected.
