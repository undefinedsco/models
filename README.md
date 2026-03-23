# `@undefineds.co/models`

Solid-first shared SDK for `undefineds.co` data contracts.

## 定位

`@undefineds.co/models` 不是单纯的 schema 仓库，它是一个 **SDK**：

- 提供共享的 Solid/RDF 数据模型、词汇表和类型
- 提供 SDK 级的数据访问描述符与通用 helper
- 提供影响面足够大的公开协议合同
- 提供可跨产品复用的治理域 helper，例如审批 / 审计 / 通知投影

它不负责：

- UI
- 具体运行时进程
- 某个产品专属的 server / worker / transport 实现
- 绑定 `xpod` 或 `linx` 的产品编排逻辑

## 核心原则

- `models` 本身就是 SDK
- 著名协议且影响面够大，可以先作为 SDK 能力进入
- 等影响面足够大，再晋升成 `xpod` 一等 API

换句话说：

- **协议合同** 可以进 `models`
- **共享治理 helper** 可以进 `models`
- **产品专属执行逻辑** 不应该进 `models`

## 包含什么

### 1. 共享数据模型

例如：

- `profile`
- `contact`
- `chat` / `thread` / `message`
- `workspace`
- `favorite`
- `settings`
- `agent`
- `approval` / `audit` / `grant` / `inboxNotification`

这些模型描述的是稳定的 Pod 数据面，而不是某个 UI 或运行时实现。

### 2. RDF 词汇表与命名空间

包内统一暴露标准词汇表和 `undefineds.co` 自定义词汇表，避免下游各自拼 IRI。

例如：

- `VCARD`
- `FOAF`
- `SIOC`
- `DCTerms`
- `WF`
- `UDFS`
- `ApprovalVocab`
- `AuditVocab`

### 3. SDK 级 repository / helper

`repository` 相关导出属于 SDK 能力的一部分，因为它们封装的是共享的数据访问约定，而不是某个产品运行时。

例如：

- `definePodRepository`
- `createRepositoryDescriptor`
- `findExactRecord`
- `updateExactRecord`
- `deleteExactRecord`

### 4. 协议合同

当某个协议具有足够公共性和影响面时，可以进入 `models` 作为 SDK 合同。

当前这类能力放在：

- `@undefineds.co/models/protocols`

例如当前的：

- 归一化运行时事件合同 `tool.call`
- `session.state`
- `tool.control`
- `inbox.approval`

这些合同描述“事件长什么样”，不描述“产品怎么处理它”。

### 5. 治理域 helper

审批 / 审计 / 通知这类能力本身属于共享数据面，因此可以像 `favorite` 一样，提供 SDK 级 helper。

当前这类能力放在：

- `@undefineds.co/models/governance`

它们负责：

- 定义稳定的投影字段
- 定义运行时事件到 Pod 行的共享映射规则
- 提供纯函数级判断 helper

它们不负责：

- 发请求
- 起服务
- 做本地/远端进程管理
- 执行产品策略

## 不包含什么

以下内容不应进入 `models`：

- `linx` 专属页面逻辑
- `xpod` 专属运行时实现
- 某个 ACP / Matrix 客户端的具体网络接入
- 某个产品独有的自动审批策略
- worker / 长驻运行时 / daemon 进程生命周期管理

## 公开入口

### 根入口

```ts
import {
  chatTable,
  contactTable,
  chatRepository,
  definePodRepository,
  ApprovalVocab,
} from '@undefineds.co/models'
```

### 协议入口

```ts
import {
  RuntimeEventSchema,
  ToolCallEventSchema,
} from '@undefineds.co/models/protocols'
```

### 治理入口

```ts
import {
  RuntimeEventProjectionRules,
  isToolWaitingApproval,
} from '@undefineds.co/models/governance'
```

## 边界判断

遇到新能力时，按下面判断：

### 应该放进 `models`

- 是共享数据结构
- 是共享 RDF 词汇表
- 是共享 repository / helper
- 是公开协议合同
- 是跨产品都可复用的纯函数级治理 helper

### 不该放进 `models`

- 只服务某一个产品
- 需要依赖具体运行时环境
- 本质是 transport / daemon / server 实现
- 带有明显产品策略或产品默认行为

## 与 `xpod` 的关系

`models` 提供共享 SDK 面。

`xpod` 可以在其上继续提供更高层的一等 API、服务实现和运行时能力。  
当某个协议或治理流程稳定且影响面足够大时，再考虑晋升为 `xpod` 一等 API。

## 开发约定

- 优先使用 Solid / RDF 叙事，而不是 SQL 表叙事
- 优先复用标准词汇表，缺失时再扩展 `UDFS`
- 共享真相先进入 `models`
- 产品特化行为留在产品层
