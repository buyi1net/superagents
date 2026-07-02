# 模块加深

在给定依赖的情况下，如何安全地加深一组浅模块。本文件假设使用 [LANGUAGE.md](LANGUAGE.md) 中的术语：**module**、**interface**、**seam**、**adapter**。

## 依赖分类

评估模块加深候选项时，先对依赖进行分类。依赖类别决定加深后的 module 如何跨越 seam 进行测试。

### 1. 进程内依赖

纯计算、内存状态、无 I/O。始终可以加深：合并 modules，并直接通过新 interface 测试。不需要 adapter。

### 2. 可本地替代依赖

有本地测试替身的依赖，例如用于 Postgres 的 PGLite、内存文件系统。如果替身存在，就可以加深。加深后的 module 在测试套件中使用该替身运行。seam 是内部的；module 的外部 interface 不需要 port。

### 3. 远程但自有依赖（Ports & Adapters）

跨网络边界的自有服务，例如 microservices、internal APIs。在 seam 上定义 **port**（interface）。深模块拥有逻辑；transport 作为 **adapter** 注入。测试使用内存 adapter。生产环境使用 HTTP / gRPC / queue adapter。

推荐形态：_“在 seam 上定义 port，为生产环境实现 HTTP adapter，为测试实现 in-memory adapter，让逻辑集中在一个深模块中，即使它跨网络部署。”_

### 4. 真正外部依赖（Mock）

你无法控制的第三方服务，例如 Stripe、Twilio 等。加深后的 module 将外部依赖作为注入的 port；测试提供 mock adapter。

## Seam 纪律

- **一个 adapter 意味着假想 seam；两个 adapter 意味着真实 seam。** 除非至少两个 adapter 有合理存在理由（通常是 production + test），否则不要引入 port。单 adapter seam 只是间接层。
- **内部 seams 与外部 seams**：深模块可以有内部 seams（implementation 私有，供自身测试使用），也可以在 interface 处有外部 seam。不要因为测试使用内部 seam，就把内部 seam 暴露到 interface 上。

## 测试策略：替换，而不是叠加

- 一旦有了加深后 module interface 上的测试，旧的浅模块 unit tests 就变成废物，删除它们。
- 在加深后 module 的 interface 上写新测试。**interface 就是测试表面**。
- 测试通过 interface 断言可观察结果，而不是内部状态。
- 测试应能经受内部重构；它们描述行为，而不是实现。如果 implementation 一变测试就必须改，那它测穿了 interface。
