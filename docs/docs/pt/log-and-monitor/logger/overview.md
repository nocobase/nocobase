:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/log-and-monitor/logger/overview).
:::

# Logs do Servidor, Logs de Auditoria e Histórico de Registros

## Logs do Servidor

### Logs do Sistema

> Veja [Logs do Sistema](./index.md#system-logs)

- Registra informações de tempo de execução do sistema da aplicação, rastreia cadeias de execução de código e identifica exceções ou erros de execução.
- Os logs são categorizados por níveis de gravidade e módulos funcionais.
- Saída via terminal ou armazenada em arquivos.
- Utilizado principalmente para diagnosticar e solucionar erros do sistema durante a operação.

### Logs de Requisição

> Veja [Logs de Requisição](./index.md#request-logs)

- Registra detalhes de requisições e respostas da API HTTP, focando no ID da requisição, caminho da API, cabeçalhos, código de status da resposta e duração.
- Saída via terminal ou armazenada em arquivos.
- Utilizado principalmente para rastrear chamadas de API e o desempenho da execução.

## Logs de Auditoria

> Veja [Logs de Auditoria](/security/audit-logger/index.md)

- Registra as ações do usuário (ou API) nos recursos do sistema, focando no tipo de recurso, objeto de destino, tipo de operação, informações do usuário e status da operação.
- Para rastrear melhor o que os usuários fizeram e quais resultados foram produzidos, os parâmetros e respostas das requisições são armazenados como metadados. Isso se sobrepõe parcialmente aos logs de requisição, mas não é idêntico — por exemplo, os logs de requisição normalmente não incluem o corpo completo da requisição.
- Os parâmetros e respostas das requisições **não são equivalentes** a instantâneos (snapshots) de dados. Eles podem revelar que tipo de operações ocorreram, mas não os dados exatos antes da modificação; portanto, não podem ser usados para controle de versão ou restauração de dados após operações incorretas.
- Armazenado tanto em arquivos quanto em tabelas do banco de dados.

![](https://static-docs.nocobase.com/202501031627922.png)

## Histórico de Registros

> Veja [Histórico de Registros](/record-history/index.md)

- Registra o **histórico de alterações** do conteúdo dos dados.
- Rastreia o tipo de recurso, objeto do recurso, tipo de operação, campos alterados e valores antes/depois.
- Útil para **comparação de dados e auditoria**.
- Armazenado em tabelas do banco de dados.

![](https://static-docs.nocobase.com/202511011338499.png)