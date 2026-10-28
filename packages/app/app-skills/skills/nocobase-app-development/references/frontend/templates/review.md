# [Design review / Acceptance review]

| Item             | Details                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Under review     | `storage/ui-workflow/<feature>/design.md` (for the acceptance review, add: the page implementation and screenshots)                                                        |
| Reviewed against | Original references and their modes, system/page records, authorized exceptions, [`ui-guidelines.md`](../ui-guidelines.md), design.md (for acceptance, add the run record) |
| Review method    | Independent subagent / Non-independent review (state why)                                                                                                                  |

## Issues

| ID  | Type | Location | Issue | Basis | Suggested fix |
| --- | ---- | -------- | ----- | ----- | ------------- |
| 1   |      |          |       |       |               |

Types:

- Design review: Blocking / Suggestion
- Acceptance review: B Blocking / D Design mismatch / G Guideline violation / S Suggestion

For Basis, give an original reference requirement (V ID), its authorized exception when relevant, a guideline ID (such as T1.4), an acceptance criterion ID (such as D3) or the run record.

Verdict: Pass / Fail / Incomplete (required evidence unavailable)

## Review checklist

One row for every line of the "Review checklist" at the end of [`ui-guidelines.md`](../ui-guidelines.md), in its order, with none left out, in a non-independent review too. Apply the design contract first and attach authorization and replacement evidence for any overridden default. Include relevant shared acceptance checks and original reference comparisons. A line that fails is also an issue above; a line the page cannot trigger says why it does not apply.

| Checklist item                                | Result                                            | Evidence                                              |
| --------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| Page template and overlay choices (T1–T5, I1) | Pass / Fail / Not verified / Not applicable (why) | Design section, screenshot file name or code location |

## Reference comparison

| Reference requirement | Mode and viewport/state | Result                     | Evidence or authorized difference |
| --------------------- | ----------------------- | -------------------------- | --------------------------------- |
| V1                    |                         | Pass / Fail / Not verified |                                   |

If no reference was supplied, say so. A missing original reference or browser/host session is a validation limit, not a pass.

## Acceptance criteria check (filled in for the acceptance review)

| Criterion | Result                     | Evidence                                          |
| --------- | -------------------------- | ------------------------------------------------- |
| D1        | Pass / Fail / Not verified | Screenshot file name, code location or run record |

## Fixes and rechecks (filled in by the main agent for the acceptance review)

Fill in every B, D and G issue; also include any S issues you fixed.

| ID  | How it was fixed | How it was rechecked (self-checks, flows exercised again, screenshots retaken) | Result                          |
| --- | ---------------- | ------------------------------------------------------------------------------ | ------------------------------- |
|     |                  |                                                                                | Resolved / Outstanding (reason) |
