---
versions:
  - label: Latest (Stable)
    features: Stable features, well-tested, only bug fixes.
    audience: Users who require a stable experience and production deployments.
    stability: ★★★★★
    production_recommendation: Recommended
  - label: Beta
    features: Includes upcoming features that have undergone initial testing and may have a few issues.
    audience: Users who want early access to new features and can provide feedback.
    stability: ★★★★☆
    production_recommendation: Use with caution
  - label: Alpha (Development)
    features: Development build with the latest features, which may be incomplete or unstable.
    audience: Technically proficient users and contributors interested in cutting-edge development.
    stability: ★★☆☆☆
    production_recommendation: Use with caution

install_methods:
  - label: Docker Installation (Recommended)
    features: No code required; quick installation; suitable for fast trials.
    scenarios: No-code users; users who want to quickly deploy to a server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Pull the latest image and restart the container.
  - label: create-nocobase-app Installation
    features: Independent application codebase; supports plugin extensions and UI customization.
    scenarios: Front-end/full-stack developers; team projects; low-code development.
    technical_requirement: ★★★☆☆
    upgrade_method: Update dependencies with yarn.
  - label: Git Source Code Installation
    features: Obtain the latest source code; suitable for contribution and debugging.
    scenarios: Technical developers; users who want to try unreleased versions.
    technical_requirement: ★★★★★
    upgrade_method: Synchronize updates through Git.
---

# Installation and Version Comparison

You can install NocoBase in different ways.

## Version Comparison

| Item | **Latest (Stable)** | **Beta** | **Alpha (Development)** |
|------|---------------------|----------|-------------------------|
| **Features** | Stable features; Well tested; only bug fixes. | Includes upcoming features that have undergone initial testing and may have a few issues. | Development build with the latest features, which may be incomplete or unstable. |
| **Audience** | Users who require a stable experience and production deployments. | Users who want early access to new features and can provide feedback. | Technically proficient users and contributors interested in cutting-edge development. |
| **Stability** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Recommended for Production** | Recommended | Use with caution | Use with caution |

## Installation Method Comparison

| Item | **Docker Installation (Recommended)** | **create-nocobase-app Installation** | **Git Source Code Installation** |
|------|--------------------------|------------------------------|------------------|
| **Features** | No code required; quick installation; suitable for fast trials. | Independent application codebase; supports plugin extensions and UI customization. | Obtain the latest source code; suitable for contribution and debugging. |
| **Scenarios** | No-code users; users who want to quickly deploy to a server. | Front-end/full-stack developers; team projects; low-code development. | Technical developers; users who want to try unreleased versions. |
| **Technical Requirement** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Upgrade Method** | Pull the latest image and restart the container. | Update dependencies with yarn. | Synchronize updates through Git. |
| **Tutorials** | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) |