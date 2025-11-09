# NOFX 上游镜像构建与发布（GHCR）

本仓库提供两种使用方式：
- 模式 A：直接在本仓库手动构建并推送上游 `NoFxAiOS/nofx` 的镜像到 GHCR。
- 模式 B：作为“可复用工作流”被其他仓库调用，构建并推送该仓库或指定上游仓库的镜像到 GHCR。

## 快速开始

- 仓库设置 → `Settings → Actions → General`：将 `Workflow permissions` 设置为 `Read and write permissions`。
- 确认你所在的组织或账户允许使用 GitHub Packages（GHCR）。镜像会发布到 `ghcr.io` 下。

## 模式 A：在本仓库手动构建上游 NOFX

- 进入仓库页面 → `Actions` → 选择工作流 `Build NOFX Upstream Images`。
- 点击 `Run workflow`，填写上游 `ref`（例如 `main` 或 `vX.Y.Z`）。
- 工作流将检出上游 `NoFxAiOS/nofx` 并构建 `backend` 和 `frontend` 镜像，推送到 GHCR。

## 模式 B：将本仓库作为可复用工作流在其他仓库调用

在“调用方仓库”创建工作流 `.github/workflows/docker-build.yml`，示例参考 `inject_examples/consumer-workflow.yml`：

```yaml
name: Build and Push via Reusable CI

on:
  push:
    branches: [main, dev]
    tags: ['v*']
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build:
    uses: your-org/nofx-build/.github/workflows/docker-build.yml@main
    with:
      create_latest: true
      registry_ghcr: ghcr.io
      # 如需构建上游 NOFX：
      checkout_repository: NoFxAiOS/nofx
      checkout_ref: main
    # 如果组织策略允许：
    # secrets: inherit
```

将 `your-org` 替换为你的 GitHub 组织或用户名。可根据需要调整触发器。

## 镜像与标签

- 发布位置：
  - `ghcr.io/<你的账户或组织>/<本仓库名>/nofx-backend`
  - `ghcr.io/<你的账户或组织>/<本仓库名>/nofx-frontend`
- 标签组成：
  - 上游 `checkout_ref`（当以上游构建时，如 `main`、`vX.Y.Z`）
  - 分支标签（基于调用方仓库的分支）
  - 语义化版本（如可解析）
  - 短 SHA 标签
  - 在 `main` 或 `dev` 分支且 `create_latest=true` 时，额外创建 `latest`

## 构建环境

- 运行器：`ubuntu-22.04`
- 多架构：使用 Docker Buildx + QEMU 构建 `linux/amd64` 与 `linux/arm64`

## 前置条件与路径约定

- 上游仓库需存在：
  - `./docker/Dockerfile.backend`
  - `./docker/Dockerfile.frontend`
- 若路径不同，请修改 `.github/workflows/docker-build.yml` 的 `matrix` 中 `dockerfile` 字段以匹配实际路径。

## 常见问题

- GHCR 推送失败：
  - 检查 `Permissions → packages: write` 是否设置在触发工作流的仓库中。
  - 确认使用的是组织或账户下允许推送 GHCR 的 `GITHUB_TOKEN`。
- 标签不符合预期：
  - 以上游构建时，会增加一个以 `checkout_ref` 命名的标签；其他标签来自调用方的分支、语义化版本与 SHA。
- 仅 GHCR 发布：
  - 本工作流不包含任何 Docker Hub 登录或推送步骤。