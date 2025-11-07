---
versions:
  - label: Latest（稳定版）
    features: 功能稳定、测试完善，仅进行缺陷修复。
    audience: 希望获得稳定体验的用户、生产环境部署。
    stability: ★★★★★
    production_recommendation: 推荐
  - label: Beta（测试版）
    features: 包含即将发布的新功能，经过初步测试，可能存在少量问题。
    audience: 希望提前体验新功能并提供反馈的用户。
    stability: ★★★★☆
    production_recommendation: 谨慎使用
  - label: Alpha（开发版）
    features: 开发中的版本，功能最新但可能不完整或不稳定。
    audience: 对前沿开发感兴趣的技术用户、贡献者。
    stability: ★★☆☆☆
    production_recommendation: 谨慎使用

install_methods:
  - label: Docker 安装（推荐）
    features: 无需编写代码，安装简单，适合快速体验。
    scenarios: 无代码用户、希望快速部署到服务器的用户。
    technical_requirement: ★☆☆☆☆
    upgrade_method: 拉取最新镜像并重启容器
  - label: create-nocobase-app 安装
    features: 业务代码独立，支持插件扩展和界面定制。
    scenarios: 前端/全栈开发者、团队项目、低代码开发。
    technical_requirement: ★★★☆☆
    upgrade_method: 使用 yarn 更新依赖
  - label: Git 源码安装
    features: 直接获取最新源码，可参与贡献与调试。
    scenarios: 技术开发者、希望体验未发布版本的用户。
    technical_requirement: ★★★★★
    upgrade_method: 通过 Git 流程同步更新
---

# 安装方式和版本对比

你可以通过不同方式安装 NocoBase。

## 版本对比

| 项目 | **Latest（稳定版）** | **Beta（测试版）** | **Alpha（开发版）** |
|------|------------------------|----------------------|-----------------------|
| **特点** | 功能稳定、测试完善，仅进行缺陷修复。 | 包含即将发布的新功能，经过初步测试，可能存在少量问题。 | 开发中的版本，功能最新但可能不完整或不稳定。 |
| **适用人群** | 希望获得稳定体验的用户、生产环境部署。 | 希望提前体验新功能并提供反馈的用户。 | 对前沿开发感兴趣的技术用户、贡献者。 |
| **稳定性** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **是否推荐生产使用** | 推荐 | 谨慎使用 | 谨慎使用 |

## 安装方式对比

| 项目 | **Docker 安装（推荐）** | **create-nocobase-app 安装** | **Git 源码安装** |
|------|--------------------------|------------------------------|------------------|
| **特点** | 无需编写代码，安装简单，适合快速体验。 | 业务代码独立，支持插件扩展和界面定制。 | 直接获取最新源码，可参与贡献与调试。 |
| **适用场景** | 无代码用户、希望快速部署到服务器的用户。 | 前端/全栈开发者、团队项目、低代码开发。 | 技术开发者、希望体验未发布版本的用户。 |
| **技术要求** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **升级方式** | 拉取最新镜像并重启容器 | 使用 yarn 更新依赖 | 通过 Git 流程同步更新 |
| **教程** | [<code>安装</code>](#) [<code>升级</code>](#) [<code>部署</code>](#) | [<code>安装</code>](#) [<code>升级</code>](#) [<code>部署</code>](#) | [<code>安装</code>](#) [<code>升级</code>](#) [<code>部署</code>](#) |
