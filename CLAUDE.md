# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LeetCode 第 189 题「轮转数组」的算法可视化演示页面，使用 React + TypeScript + Vite 构建，部署在 GitHub Pages。

## 常用命令

```bash
pnpm dev          # 启动开发服务器（端口 56018）
pnpm build        # 构建（tsc -b && vite build）
pnpm lint         # ESLint 检查
pnpm preview      # 本地预览构建产物
```

## 架构说明

### 数据流

App.tsx 作为唯一状态容器，持有 `inputData`（nums/k）、`currentSolutionId`、`currentStepIndex`、`isPlaying`、`speed`。通过 `useMemo` 调用 `solution.generateSteps()` 将算法逻辑转化为 `AlgorithmStep[]` 数组，传递给 Canvas 和 CodePanel 渲染。

### 算法模块 (`src/algorithms/`)

每个解法是一个纯函数模块，实现 `AlgorithmSolution` 接口：接收 `nums: number[], k: number`，返回 `AlgorithmStep[]`。每一步包含 `arrayState`、`highlightIndices`、`codeLines`（按语言分）、`animationType` 等可视化元数据。新增算法只需在此目录添加文件并在 `index.ts` 注册。

### 核心组件

- **Canvas** — D3.js 渲染数组状态和动画
- **CodePanel** — prism-react-renderer 语法高亮，根据当前步骤高亮代码行
- **ControlPanel** — 播放/暂停/上一步/下一步/速度/跳转
- **DataInput** — 输入数组和 k 值
- **SolutionTabs** — 切换算法解法
- **AlgorithmModal** — 展示算法详细说明（复杂度、思路）

### 类型 (`src/types/index.ts`)

`AlgorithmStep` 和 `AlgorithmSolution` 是核心类型。`AlgorithmStep.codeLines` 支持按语言独立配置高亮行号（java / python / golang / javascript）。

### 样式

使用 CSS Modules（`.module.css`），无 CSS-in-JS 或 Tailwind。全局样式在 `src/styles/`。

### Claude Code 交付约定

- 每次完成代码变更后，都必须先运行 `npm run build` 和 `npm run lint`。
- 验证通过后，将本次改动提交并推送到 `main`，由 `.github/workflows/deploy.yml` 自动部署 GitHub Pages；不只停留在本地预览或构建产物。
- 推送后检查对应 GitHub Actions 部署任务为成功，并核对线上页面可访问，再向用户交付变更摘要、线上 URL 和验证结果。
- 若构建/检查失败，或部署任务失败，不得宣称线上已更新；应先修复并重新验证。
- 交付前只暂存本次明确修改的文件，避免纳入无关工作区内容。
