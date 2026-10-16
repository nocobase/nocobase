---
'@nocobase/studio': patch
---

An issue's own page is now the same task detail the split view shows beside its list, so a task reads and works the same way wherever it is opened. Once the detail is at least 1024 pixels wide, on its own page or beside a narrow list, its properties take a column of their own on the right, with what "More properties" holds unfolded. Opened from the table or the split view, a task's page moves through that list with its arrows or J and K, and Back returns to the list. On a phone the detail's top row is the page's only row, with the way back and the navigation. The split view's keys no longer act on a list covered by a task's page.

The task detail's chips are now the priority, owner and executor; the labels, project and due date join "More properties". Once the summary has scrolled away, its one-line bar (status, title and what waits for the viewer, Accept included) stays at the top of the detail. A reply left empty folds the comment box back when the focus leaves it.
