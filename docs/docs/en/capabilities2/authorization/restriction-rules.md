---
title: 'Restriction rules'
---

# Restriction rules

Restrictions narrow existing access so job scopes, default access, and sharing observe a common boundary. They do not grant actions or records by themselves.

## Extra-fee collaboration

```text
Northstar's fee collaboration responsibility covers requests with extra fees at most 2,000.
Restrict View extra-fee requests for the applicable employees to amounts less than or equal to 2,000.
Apply it to viewing scope obtained from jobs, default access, and sharing.
Expose this condition in Team access.
Do not treat the restriction as a grant or give access to employees without viewing permission.
```

Employees see records they could already access that also meet the amount condition. Exactly 2,000 is allowed; sharing a higher-value request cannot bypass the restriction.

## Per-action boundaries

This example restricts viewing. Define editing or approval restrictions separately if required.

Restrictions intersect with existing authorization, and multiple restrictions must all hold. Conditions describe allowed access: non-sensitive means only non-sensitive records remain.

Complex related-record conditions and cross-action boundaries require further integration. [Inspection](./inspector.md) explains sources; the actual employee's pages demonstrate business effects.
