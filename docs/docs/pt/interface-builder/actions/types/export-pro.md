---
pkg: "@nocobase/plugin-action-export-pro"
title: "Action Exportar Pro"
description: "Action Exportar Pro: funcionalidade avançada de exportação, com suporte para templates personalizados, exportação de várias tabelas e formatos complexos."
keywords: "Exportar Pro,ExportPro,exportação avançada,template personalizado,interface builder,NocoBase"
---

:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Exportar Pro

## Introdução

O plugin Exportar Pro oferece funcionalidades avançadas baseadas na funcionalidade comum de exportação.

## Instalação

Este plugin depende do plugin de gerenciamento de tarefas assíncronas. Antes de utilizá-lo, ative o plugin de gerenciamento de tarefas assíncronas.

## Funcionalidades aprimoradas

- Suporta exportação assíncrona, executada em uma thread independente, adequada para grandes volumes de dados.
- Suporta exportação de anexos.

## Manual de uso

### Configuração do modo de exportação

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)


No botão de exportação, é possível configurar o modo de exportação. Existem três modos disponíveis:

- Automático: o modo de exportação é determinado pela quantidade de dados no momento da exportação. Se a quantidade for inferior a 1000 registros (100 registros para exportação de anexos), será utilizado o modo síncrono; caso contrário, será utilizado o modo assíncrono.
- Síncrono: a exportação é executada na thread principal. Adequado para volumes pequenos de dados. Executar exportações de grande volume em modo síncrono pode bloquear o sistema, causar lentidão e impedir o atendimento de outras requisições.
- Assíncrono: a exportação é executada em uma thread independente em segundo plano, sem bloquear a utilização do sistema.

### Exportação assíncrona

Após executar a exportação, o processo é executado em uma thread independente em segundo plano, sem necessidade de configuração manual pelo usuário. Na interface do usuário, após iniciar a exportação, é exibido no canto superior direito o status da tarefa de exportação em andamento, com a barra de progresso em tempo real.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Concluída a exportação, é possível baixar o arquivo gerado na lista de tarefas de exportação.

#### Exportação concorrente
Quando há muitas tarefas de exportação concorrentes, o desempenho do sistema pode ser afetado pela configuração do servidor. Por isso, recomenda-se que o desenvolvedor do sistema configure o número máximo de tarefas de exportação concorrentes (padrão: 3). Quando excedido o limite configurado, as tarefas entram em fila de espera.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Forma de configuração da concorrência: variável de ambiente ASYNC_TASK_MAX_CONCURRENCY=número de concorrências

Em testes combinados com diferentes configurações e complexidades de dados, recomenda-se:
- 2 núcleos de CPU: concorrência 3.
- 4 núcleos de CPU: concorrência 5.

#### Sobre desempenho
Quando observar exportação anormalmente lenta (consulte a referência abaixo), é provável que o problema de desempenho esteja relacionado com a estrutura da tabela.

| Característica dos dados | Tipo de índice | Volume | Tempo de exportação |
| --- | --- | --- | --- |
| Sem campos de relação | Chave primária / restrição única | 1 milhão | 3 a 6 minutos |
| Sem campos de relação | Índice comum | 1 milhão | 6 a 10 minutos |
| Sem campos de relação | Índice composto (não único) | 1 milhão | 30 minutos |
| Com campos de relação<br>(um para um, um para muitos,<br>muitos para um, muitos para muitos) | Chave primária / restrição única | 500 mil | 15 a 30 minutos |

Para garantir uma exportação eficiente, recomenda-se:
1. A tabela deve atender às seguintes condições:

| Tipo de condição | Condição necessária | Observações |
| --- | --- | --- |
| Estrutura da tabela (atender pelo menos uma) | Possuir chave primária<br>Possuir restrição única<br>Possuir índice (único, comum ou composto) | Prioridade: chave primária > restrição única > índice |
| Característica do campo | A chave primária / restrição única / índice (qualquer um) deve ser ordenável, como: ID autoincremento, Snowflake ID, UUID v1, timestamp, número, etc.<br>(Atenção: UUID v3/v4/v5, strings comuns e outros campos não ordenáveis afetam o desempenho) | Nenhuma |

2. Reduza os campos desnecessários na exportação, especialmente campos de relação (problema de desempenho dos campos de relação ainda em otimização).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Se mesmo cumprindo as condições acima a exportação continuar lenta, faça análise de logs ou reporte oficialmente.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)


- [Linkage rule](/interface-builder/actions/action-settings/linkage-rule): exibir/ocultar dinamicamente o botão;
- [Edit button](/interface-builder/actions/action-settings/edit-button): editar título, tipo e ícone do botão;
