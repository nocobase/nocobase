---
'@nocobase/app-skills': patch
---

The frontend handbook closes the gap a generated support-centre application hit when saving an edit form:

- The unsaved-changes example in `overlay.md` section 2.5 now shows the whole flow, not only the overlay shell: the form's body reports through a stable `onDirtyChange`, and its success path clears `dirtyRef` (`onDirtyChange(false)`) before `onSaved` and `close()`, so the close after a save no longer asks to discard the changes that were just saved.
- `frontend-dev.md` gains the matching "Common mistakes" entry, pointing back to that section.
