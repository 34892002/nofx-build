# NOFX 镜像构建与发布（GHCR）

本仓库支持：
- 手动或自动构建上游 `NoFxAiOS/nofx` 的 `backend` 与 `frontend` 镜像；
- 作为“可复用工作流”在其他仓库中调用，构建并推送到 GHCR。

## 快速开始

- 仓库设置 → `Settings → Actions → General`：将 `Workflow permissions` 设为 `Read and write permissions`。
- 确认组织或账户允许使用 GitHub Packages（GHCR）。镜像发布到 `ghcr.io`。

## 手动构建（本仓库）

- 工作流：`Build NOFX Docker`（文件：`./.github/workflows/build-docker.yml`）。
- 运行方式：`Actions → Run workflow`，填写上游 `ref`（如 `main`、`dev`、`vX.Y.Z`）。
- 输出：推送 `nofx-backend` 与 `nofx-frontend` 到 GHCR。

## 作为复用工作流被调用（其他仓库）

在调用方仓库创建工作流，示例：

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
    uses: your-org/nofx-build/.github/workflows/docker-build-reusable.yml@main
    with:
      registry_ghcr: ghcr.io
      create_latest: true # 仅在 main 分支生成 latest
      # 如需构建上游 NOFX：
      checkout_repository: NoFxAiOS/nofx
      checkout_ref: main
    secrets: inherit
```

将 `your-org` 替换为你的 GitHub 组织或用户名。根据需要调整触发。

## 自动构建（上游 main 监控）

- 工作流：`Auto Build Upstream Main`（文件：`./.github/workflows/auto-build-upstream.yml`）。
- 触发：
  - `schedule`: 每 2 小时检查一次上游 `NoFxAiOS/nofx@main`；
  - `repository_dispatch`: 事件 `nofx-main-updated`；
  - `workflow_dispatch`: 手动触发。
 - 逻辑：读取上游最新 `SHA`，命中缓存则跳过；否则构建并发布到 GHCR（main 构建会生成 `main` 标签）。

## 标签策略

- 发布位置：
  - `ghcr.io/<你的账户或组织>/<本仓库名>/nofx-backend`
  - `ghcr.io/<你的账户或组织>/<本仓库名>/nofx-frontend`
- 仅保留分支别名两类：
- `main`：上游 `main` 自动构建的最新版本；
- `dev`：上游 `dev` 手动/指定构建的最新版本。
- 不再创建全局 `latest` 或其它派生标签（如 `main-amd64`、`main-<sha>-amd64`）。

## 构建环境与架构

- 运行器：`ubuntu-22.04`
- 架构：仅构建和发布 `linux/amd64`（已移除 QEMU 与 `arm64`）。


## 常见问题

- GHCR 推送失败：
  - 检查 `Permissions → packages: write` 是否设置在触发工作流的仓库中；
  - 确认 `GITHUB_TOKEN` 具有 GHCR 推送权限。
- 标签不符合预期：
  - 上游构建会增加一个以 `checkout_ref` 命名的标签；
  - 仅 `main` 分支在 `create_latest=true` 时生成 `latest`。
- 运行失败（加密未满足）：
  - 确保提供 `DATA_ENCRYPTION_KEY` 与 RSA 密钥目录挂载；
  - 参考上游文档：`scripts/ENCRYPTION_README.md`。