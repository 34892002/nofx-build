# NOFX Build CI（可复用工作流模板）

这个目录是一个“独立 CI 仓库”的骨架，用来承载可复用的 Docker 构建工作流。你可以将 `nofx-build` 目录的内容单独推到一个新的仓库（例如 `your-org/nofx-build`），然后在需要构建 NOFX 的仓库里通过 `workflow_call` 直接复用它。

## 用法

- 新建仓库：例如 `your-org/nofx-build`。
- 把本目录内容原样拷贝到新仓库根目录（包含 `.github/workflows/docker-build-reusable.yml`）。
- 在“调用方仓库”中添加一个轻薄的工作流文件，示例见下文。
- 在调用方仓库配置 Secrets（如 `DOCKERHUB_USERNAME`、`DOCKERHUB_TOKEN`）。`GITHUB_TOKEN`会自动注入，权限由调用方工作流的 `permissions` 决定。
- 在调用方仓库 `Settings → Actions → General`：
  - 将 `Workflow permissions` 设置为 `Read and write permissions`，以允许推送 GHCR 包。

## 调用示例（放在调用方仓库）

在调用方仓库创建 `.github/workflows/docker-build-reusable.yml`：

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
      create_latest: true
      registry_ghcr: ghcr.io
      # 不 Fork 上游时，指定上游公开仓库与分支/标签
      checkout_repository: NoFxAiOS/nofx
      checkout_ref: main
    # 选择其一：
    # secrets: inherit  # 继承调用方仓库全部 secrets（同组织限制下可用）
    secrets:
      DOCKERHUB_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}
      DOCKERHUB_TOKEN: ${{ secrets.DOCKERHUB_TOKEN }}
```

将 `your-org` 替换为你的 GitHub 组织或用户名。

## 说明与注意事项

- 可复用工作流里会自动检出“调用方仓库”的代码并构建。
- 如果你传入了 `checkout_repository`，工作流会改为检出指定的上游仓库（例如 `NoFxAiOS/nofx`）以及 `checkout_ref` 指定的分支或标签，从而实现“不 Fork 上游也能构建”。
- `GITHUB_TOKEN` 的权限来自调用方工作流的 `permissions`，不能在被调用工作流中提升。
- 如果调用方和 `nofx-build` 仓库是私有仓库，需同组织并允许跨仓库工作流调用；公共仓库则更简单。
- ARM64 原生 Runner 标签可能因 GitHub 账户而异，必要时将 `ubuntu-22.04-arm` 改为你账户可用的标签；或退化为 QEMU（不在本模板中启用）。