# 事件流

在 FlowEngine 中，界面的所有组件都是 **事件驱动（Event-driven）** 的。  
组件的行为、交互和数据变化，都是由事件（Event）触发并通过流（Flow）执行的。

## 静态流与动态流

在 FlowEngine 中，流（Flow）可以分为两种：

### **1. 静态流（Static Flow）**

- 由开发者在代码中定义；
- 作用于某个 **Model 类的所有实例**；
- 常用于处理某个 Model 类的通用逻辑；

### **2. 动态流（Dynamic Flow）**

- 由用户在界面上配置；
- 只对某个具体实例生效；
- 常用于特定场景的个性化行为；

简而言之：**静态流是定义在类上的逻辑模板，动态流是定义在实例上的个性化逻辑。**

## 联动规则 vs 动态流

在 FlowEngine 的配置体系中，有两种实现事件逻辑的方式：

### **1. 联动规则（Linkage Rules）**

- 是 **内置的事件流 Step 封装**；
- 配置更简单，语义化更强；
- 本质上仍然是 **事件流（Flow）** 的一种简化形式。

### **2. 动态流（Dynamic Flow）**

- 完整的 Flow 配置能力；
- 可自定义：
  - **触发器（on）**：定义何时触发；
  - **执行步骤（steps）**：定义执行的逻辑；
- 适用于更复杂、灵活的业务逻辑。

因此，**联动规则 ≈ 简化版事件流**，两者的核心机制一致。

## FlowAction 的一致性

无论是 **联动规则** 还是 **事件流**，都应该使用相同的 **FlowAction** 集合。  
也就是说：

- **FlowAction** 定义了可被 Flow 调用的操作；
- 两者共用一套动作体系，而不是分别实现两套；
- 这样可以确保逻辑复用、扩展一致。

## 概念层级

从概念上，FlowModel 的核心抽象关系如下：

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── 全局事件（Global Events）
      │     └── 局部事件（Local Events）
      └── FlowActionDefinition
            ├── 全局操作（Global Actions）
            └── 局部操作（Local Actions）
```

### 层级说明

- **FlowModel**  
  表示一个可配置、可执行流逻辑的模型实体。

- **FlowDefinition**  
  定义一组完整的流逻辑（包含触发条件与执行步骤）。

- **FlowEventDefinition**  
  定义流的触发源，包括：
  - **全局事件**：如应用启动、数据加载完成；
  - **局部事件**：如字段变化、按钮点击。

- **FlowActionDefinition**  
  定义流可执行的动作，包括：
  - **全局操作**：如刷新页面、全局通知；
  - **局部操作**：如修改字段值、切换组件状态。

## 小结

| 概念 | 作用 | 生效范围 |
|------|------|-----------|
| **静态流 (Static Flow)** | 在代码中定义的流逻辑 | 所有 XXModel 的实例 |
| **动态流 (Dynamic Flow)** | 在界面上定义的流逻辑 | 单个 FlowModel 实例 | 
| **FlowEvent** | 定义触发器（何时触发）| 全局或局部 | 
| **FlowAction** | 定义执行逻辑 | 全局或局部 |
| **联动规则 (Linkage Rule)** | 简化的事件流的 Step 封装 | 区块、操作级 | 
