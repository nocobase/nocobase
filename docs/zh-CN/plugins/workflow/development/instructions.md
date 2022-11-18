# 扩展节点类型

节点的类型本质上就是操作指令，不同的指令代表流程中执行的不同的操作。

与触发器类似，扩展节点的类型也分为前后端两部分。服务端需要对注册的指令进行逻辑实现，客户端需要提供指令内容的界面配置。

## 服务端

指令的基础内容是一个函数，函数中可以执行任意需要的操作，例如数据库操作、文件操作、调用第三方 API 等等。另外，指令的返回对象中的状态值，将决定该节点在流程中的后续处理的流向。

最简单的指令只需要定义一个 `run` 函数即可：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const myInstruction = {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
};
```

返回值中必须要包含该指令执行完以后的状态描述，必须是常量 `JOB_STATUS` 中的值，通常使用 `JOB_STATUS.RESOVLED` 即可，代表该节点成功执行完毕，会继续后续节点的执行。如果有需要提前保存的结果值，也可以调用 `processor.saveJob` 方法，并返回该方法的返回对象。

如果有特定的执行结果，尤其是准备可供后续节点使用的数据，可以通过 `result` 属性返回：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const randomString = {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(digit, '0');
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  }
}
```

其中 `node.config` 是节点的配置项，可以是需要的任意值，会以 `JSON` 类型字段保存在数据库对应的节点记录中。

如果执行过程可能会有异常，可以提前捕获后并返回失败状态：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.REJECTED,
        result: error
      };
    }
  }
};
```

如果不对可预测的异常进行捕获，那么流程引擎会自动捕获并返回失败状态。如果执行中使用了事务，可能造成事务的回滚。

当需要进行流程控制或者异步（耗时）IO 操作时，可以返回 `JOB_STATUS.PENDING` 状态表示该流程暂时挂起，等待某些外部异步操作完成后，通知流程引擎继续执行。如果在 `run` 函数中返回了挂起的状态值，则该指令必须实现 `resume` 方法，否则无法恢复流程的执行：

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const pay = {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING
    });

    const { plugin } = processor;
    // do payment
    await paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return plugin.resume(job.id, result);
    });

    // return created job instance
    return job;
  },
  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  }
};
```

其中 `paymentService` 指代某个支付服务，在服务的回调中再触发工作流恢复对应任务的执行流程，当前流程先退出。之后由工作流引擎创建新的处理器转交到节点的 `resume` 方法中，将之前已挂起的节点继续执行。

注：这里说的“异步操作”不是指 JavaScript 中的 `async` 函数，而是与其他外部系统交互时，某些非即时返回的操作，比如支付服务会需要等待另外的通知才能知道结果。

## 客户端

与触发器类型，节点类型的配置内容需要在前端实现。

例如我们需要为上面在服务端定义的随机数字符串类型（`randomString`）的节点提供配置界面，其中有一个配置项是 `digit` 代表随机数的位数，在配置表单中我们使用一个数字输入框来接收用户输入。

```tsx | pure
import { instructions } from '@nocobase/workflow/client';

instructions.register('randomString', {
  title: 'Generate random number string',
  group: 'extended',
  fieldset: {
    'config.digit': {
      type: 'number',
      title: 'Digit',
      name: 'config.digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  },
  getter() {
    return <span>Random number string</span>;
  }
});
```

注：客户端注册的节点类型标识必须与服务端的保持一致，否则会导致错误。

定义节点类型的其他内容详见 [工作流 API 参考](../api#instructionsregister) 部分。
