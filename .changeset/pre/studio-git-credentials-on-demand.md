---
'@nocobase/studio': patch
---

Issue Git push credentials to runners on demand. A runner that announces the `gitCredentials` feature now asks Studio for a GitHub App installation token whenever git needs one, instead of keeping the single token handed out with the claim, so runs that outlast one token (about an hour) can still push. The token keeps the same scope: the run's repositories of that connection with `contents: write`. A cached token is reused only while it has at least 30 minutes left, and a refresh after GitHub refused the last one always mints a new token. Older runners keep getting one token with the claim, and personal token connections are unchanged.
