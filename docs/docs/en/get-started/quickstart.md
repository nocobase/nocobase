---
versions:
  - label: Latest (Stable)
    features: Stable features, well-tested, only bug fixes.
    audience: Users who want a stable experience, production environment deployment.
    stability: ★★★★★
    production_recommendation: Recommended
  - label: Beta
    features: Includes upcoming new features, has undergone initial testing, and may have a few issues.
    audience: Users who want to experience new features in advance and provide feedback.
    stability: ★★★★☆
    production_recommendation: Use with caution
  - label: Alpha (Development)
    features: A version under development, with the latest features but may be incomplete or unstable.
    audience: Technical users and contributors interested in cutting-edge development.
    stability: ★★☆☆☆
    production_recommendation: Use with caution

install_methods:
  - label: Docker Installation (Recommended)
    features: No coding required, simple installation, suitable for a quick experience.
    scenarios: No-code users, users who want to quickly deploy to a server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Pull the latest image and restart the container
  - label: create-nocobase-app Installation
    features: Independent business code, supports plugin extensions and interface customization.
    scenarios: Front-end/full-stack developers, team projects, low-code development.
    technical_requirement: ★★★☆☆
    upgrade_method: Update dependencies using yarn
  - label: Git Source Code Installation
    features: Get the latest source code directly, can participate in contribution and debugging.
    scenarios: Technical developers, users who want to experience unreleased versions.
    technical_requirement: ★★★★★
    upgrade_method: Synchronize updates through the Git process
---

# Installation and Version Comparison

You can install NocoBase in different ways.

## Version Comparison

| Item | **Latest (Stable)** | **Beta** | **Alpha (Development)** |
|------|------------------------|----------------------|-----------------------|
| **Features** | Stable features, well-tested, only bug fixes. | Includes upcoming new features, has undergone initial testing, and may have a few issues. | A version under development, with the latest features but may be incomplete or unstable. |
| **Audience** | Users who want a stable experience, production environment deployment. | Users who want to experience new features in advance and provide feedback. | Technical users and contributors interested in cutting-edge development. |
| **Stability** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Recommended for Production** | Recommended | Use with caution | Use with caution |

## Installation Method Comparison

| Item | **Docker Installation (Recommended)** | **create-nocobase-app Installation** | **Git Source Code Installation** |
|------|--------------------------|------------------------------|------------------|
| **Features** | No coding required, simple installation, suitable for a quick experience. | Independent business code, supports plugin extensions and interface customization. | Get the latest source code directly, can participate in contribution and debugging. |
| **Scenarios** | No-code users, users who want to quickly deploy to a server. | Front-end/full-stack developers, team projects, low-code development. | Technical developers, users who want to experience unreleased versions. |
| **Technical Requirement** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Upgrade Method** | Pull the latest image and restart the container | Update dependencies using yarn | Synchronize updates through the Git process |
| **Tutorials** | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) |