# Releases on the command line

Release management (Releases › Apps and Releases › Environments in the web page) is fully on the command line. The [reference](reference/index.md) has every flag: [env](reference/env.md), [registry](reference/registry.md), [app](reference/app.md), [release](reference/release.md), [build](reference/build.md) and [deploy](reference/deploy.md).

## Set up once

```bash
nb-studio env driver list
nb-studio env create staging --name Staging --driver host
nb-studio env create production --file production.json      # protected, with approvers
nb-studio env check staging
nb-studio registry create ghcr --name GHCR --url https://ghcr.io --namespace my-org
nb-studio app create my-app --name "My App" --env staging
nb-studio build repo set <repo> --file apps.json            # which apps a repository builds
nb-studio build workflow <repo> > .github/workflows/nb-studio.yml
```

Checking an environment's or a registry's unsaved settings is the forms' "Check" button; `env check` and `registry check` check saved ones.

## Ship

```bash
nb-studio app ensure my-app --environment staging                 # CI: the App, made when missing
nb-studio deploy --app my-app --sha <sha> --file dist.tar.gz      # CI: uploaded and deployed
nb-studio deploy --app my-app --release <release>                 # a release that exists
nb-studio release list my-app
nb-studio app deploy my-app --release <release> --wait true
nb-studio app logs my-app
nb-studio release promote my-app <release> --to production
nb-studio app rollback my-app --deployment <deployment>
```

A protected environment takes a request instead of a deploy: `nb-studio deploy request my-app --release <release> --note "Ready for production"`, which its approvers see in their inbox and decide with `nb-studio deploy request approve <request>` or `reject`. `nb-studio deploy request list --awaiting-me true` lists what waits on you.

## Agents

A run may list environments and apps, read logs, deploy and roll back an app, and request a deployment, each within the actions its agent is given; approving a request stays a person's.
