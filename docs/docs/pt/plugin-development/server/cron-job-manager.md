:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# CronJobManager

`CronJobManager` é um gerenciador de tarefas agendadas fornecido pelo NocoBase, baseado em [cron](https://www.npmjs.com/package/cron). Ele permite que os plugins registrem tarefas agendadas no servidor para executar lógicas específicas periodicamente.

## Uso Básico

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Executar diariamente às 00:00
      onTick: async () => {
        console.log('Tarefa diária: limpar dados temporários');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Início automático
    });
  }

  async cleanTemporaryData() {
    // Execute a lógica de limpeza aqui
  }
}
```

## Descrição dos Parâmetros

A definição do tipo `CronJobParameters` é a seguinte (do [cron](https://www.npmjs.com/package/cron)):

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| Parâmetro        | Tipo                       | Descrição                                                                                               |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Expressão de tempo da tarefa agendada. Suporta expressões cron padrão, por exemplo, `0 0 * * *` significa executar diariamente às 00:00. |
| **onTick**       | `function`                 | Função principal da tarefa. Será acionada no horário especificado.                                      |
| **onComplete**   | `function`                 | Executa quando a tarefa é parada por `job.stop()` ou após a função `onTick` ser concluída.             |
| **timeZone**     | `string`                   | Especifica o fuso horário de execução (por exemplo, `Asia/Shanghai`).                                   |
| **context**      | `any`                      | Contexto ao executar `onTick`.                                                                          |
| **runOnInit**    | `boolean`                  | Indica se deve ser executado uma vez imediatamente na inicialização.                                    |
| **utcOffset**    | `string \| number`         | Especifica o deslocamento do fuso horário.                                                              |
| **unrefTimeout** | `boolean`                  | Controla se o loop de eventos permanece ativo.                                                          |

## Exemplos de Expressões Cron

| Expressão        | Significado                     |
| ---------------- | ------------------------------- |
| `* * * * *`      | Executa a cada minuto           |
| `0 * * * *`      | Executa a cada hora             |
| `0 0 * * *`      | Executa diariamente às 00:00    |
| `0 9 * * 1`      | Executa toda segunda-feira às 09:00 |
| `*/10 * * * *`   | Executa a cada 10 minutos       |

> 💡 Você pode usar [crontab.guru](https://crontab.guru/) para ajudar a gerar expressões.

## Controlando o Início e a Parada das Tarefas

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Inicia a tarefa
job.stop();  // Para a tarefa
```

:::tip

As tarefas agendadas iniciam e param junto com a aplicação. Geralmente, você não precisa iniciá-las ou pará-las manualmente.

:::