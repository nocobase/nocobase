:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Logs do Servidor, Logs de Auditoria e Histórico de Registros

## Logs do Servidor

### Logs do Sistema

> Veja [Logs do Sistema](#)

- Registram informações de tempo de execução do sistema da aplicação, rastreiam cadeias de execução de código e localizam exceções ou erros de tempo de execução.
- Os logs são categorizados por níveis de severidade e módulos funcionais.
- São exibidos via terminal ou armazenados como arquivos.
- São usados principalmente para diagnosticar e solucionar problemas do sistema durante a operação.

### Logs de Requisição

> Veja [Logs de Requisição](#)

- Registram detalhes de requisições e respostas de APIs HTTP, com foco no ID da requisição, caminho da API, cabeçalhos, código de status da resposta e duração.
- São exibidos via terminal ou armazenados como arquivos.
- São usados principalmente para rastrear invocações de API e o desempenho da execução.

## Logs de Auditoria

> Veja [Logs de Auditoria](../security/audit-logger/index.md)

- Registram as ações de usuários (ou APIs) sobre os recursos do sistema, com foco no tipo de recurso, objeto alvo, tipo de operação, informações do usuário e status da operação.
- Para rastrear melhor o que os usuários fizeram e quais resultados foram produzidos, os parâmetros e as respostas das requisições são armazenados como metadados. Isso se sobrepõe parcialmente aos logs de requisição, mas não é idêntico — por exemplo, os logs de requisição geralmente não incluem o corpo completo da requisição.
- Os parâmetros e as respostas das requisições **não são equivalentes** a instantâneos de dados. Eles podem revelar que tipo de operações ocorreram, mas não os dados exatos antes da modificação, portanto, não podem ser usados para controle de versão ou restauração de dados após operações incorretas.
- Armazenados tanto como arquivos quanto como tabelas de banco de dados.

![](https://static-docs.nocobase.com/202501031627922.png)

## Histórico de Registros

> Veja [Histórico de Registros](/record-history/index.md)

- Registra o **histórico de alterações** do conteúdo dos dados.
- Os principais itens registrados são: tipo de recurso, objeto de recurso, tipo de operação, campos alterados e valores antes/depois da alteração.
- Útil para **comparação e auditoria de dados**.
- Armazenado em tabelas de banco de dados.

![](https://static-docs.nocobase.com/202511011338499.png)