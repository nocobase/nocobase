---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Importar Pro

## Introdução

O plugin Importar Pro oferece recursos aprimorados em relação à funcionalidade de importação padrão.

## Instalação

Este plugin depende do plugin de Gerenciamento de Tarefas Assíncronas. Você precisa habilitá-lo antes de usar o Importar Pro.

## Aprimoramentos de Funcionalidade

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Suporta operações de importação assíncronas, executadas em um thread separado, permitindo a importação de grandes volumes de dados.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Suporta opções avançadas de importação.

## Manual do Usuário

### Importação Assíncrona

Após iniciar uma importação, o processo será executado em um thread de segundo plano separado, sem a necessidade de configuração manual pelo usuário. Na interface, depois de iniciar a importação, a tarefa em andamento será exibida no canto superior direito, mostrando o progresso em tempo real.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Após a conclusão da importação, você pode visualizar os resultados nas tarefas de importação.

#### Sobre o Desempenho

Para avaliar o desempenho da importação de grandes volumes de dados, realizamos testes comparativos em diferentes cenários, tipos de campo e configurações de gatilho (os resultados podem variar dependendo das configurações do servidor e do banco de dados, e são apenas para referência):

| Volume de Dados | Tipos de Campo | Configuração de Importação | Tempo de Processamento |
|------|---------|---------|---------|
| 1 milhão de registros | String, Número, Data, E-mail, Texto Longo | • Acionar fluxo de trabalho: Não<br>• Identificador de Duplicados: Nenhum | Aprox. 1 minuto |
| 500.000 registros | String, Número, Data, E-mail, Texto Longo, Muitos-para-Muitos | • Acionar fluxo de trabalho: Não<br>• Identificador de Duplicados: Nenhum | Aprox. 16 minutos|
| 500.000 registros | String, Número, Data, E-mail, Texto Longo, Muitos-para-Muitos, Muitos-para-Um | • Acionar fluxo de trabalho: Não<br>• Identificador de Duplicados: Nenhum | Aprox. 22 minutos |
| 500.000 registros | String, Número, Data, E-mail, Texto Longo, Muitos-para-Muitos, Muitos-para-Um | • Acionar fluxo de trabalho: Notificação de gatilho assíncrono<br>• Identificador de Duplicados: Nenhum | Aprox. 22 minutos |
| 500.000 registros | String, Número, Data, E-mail, Texto Longo, Muitos-para-Muitos, Muitos-para-Um | • Acionar fluxo de trabalho: Notificação de gatilho assíncrono<br>• Identificador de Duplicados: Atualizar duplicados, com 50.000 registros duplicados | Aprox. 3 horas |

Com base nos resultados dos testes de desempenho acima e em alguns designs existentes, temos as seguintes explicações e sugestões sobre os fatores que influenciam:

1.  **Mecanismo de Tratamento de Registros Duplicados**: Ao selecionar as opções **Atualizar registros duplicados** ou **Apenas atualizar registros duplicados**, o sistema executa operações de consulta e atualização linha por linha, o que reduz significativamente a eficiência da importação. Se o seu arquivo Excel contiver dados duplicados desnecessários, isso impactará ainda mais a velocidade da importação. Recomendamos que você limpe os dados duplicados desnecessários no arquivo Excel (por exemplo, usando ferramentas profissionais de remoção de duplicatas) antes de importá-los para o sistema, evitando assim a perda de tempo desnecessária.

2.  **Eficiência no Processamento de Campos de Relacionamento**: O sistema processa campos de relacionamento consultando associações linha por linha, o que pode se tornar um gargalo de desempenho em cenários com grandes volumes de dados. Para estruturas de relacionamento simples (como uma associação de um-para-muitos entre duas **coleções**), recomendamos uma estratégia de importação em várias etapas: primeiro, importe os dados básicos da **coleção** principal e, em seguida, estabeleça o relacionamento entre as **coleções** após a conclusão. Se os requisitos de negócios exigirem a importação simultânea de dados de relacionamento, consulte os resultados dos testes de desempenho na tabela acima para planejar seu tempo de importação de forma razoável.

3.  **Mecanismo de Acionamento de fluxo de trabalho**: Não é recomendado habilitar gatilhos de **fluxo de trabalho** em cenários de importação de grandes volumes de dados, principalmente pelos dois motivos a seguir:
    -   Mesmo quando o status da tarefa de importação mostra 100%, ela não termina imediatamente. O sistema ainda precisa de tempo extra para criar os planos de execução do **fluxo de trabalho**. Durante esta fase, o sistema gera um plano de execução de **fluxo de trabalho** correspondente para cada registro importado, o que ocupa o thread de importação, mas não afeta o uso dos dados já importados.
    -   Após a conclusão total da tarefa de importação, a execução concorrente de um grande número de **fluxos de trabalho** pode sobrecarregar os recursos do sistema, afetando a capacidade de resposta geral do sistema e a experiência do usuário.

Os 3 fatores de influência acima serão considerados para otimização futura.

### Configuração de Importação

#### Opções de Importação - Acionar fluxo de trabalho

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Você pode escolher se deseja acionar **fluxos de trabalho** durante a importação. Se esta opção estiver marcada e a **coleção** estiver vinculada a um **fluxo de trabalho** (evento da **coleção**), a importação acionará a execução do **fluxo de trabalho** para cada linha.

#### Opções de Importação - Identificar Registros Duplicados

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Marque esta opção e selecione o modo correspondente para identificar e processar registros duplicados durante a importação.

As opções na configuração de importação serão aplicadas como valores padrão. Os administradores podem controlar se permitem que o usuário que realiza o upload modifique essas opções (exceto a opção de acionar **fluxo de trabalho**).

**Configurações de Permissão do Usuário de Upload**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Permitir que o usuário de upload modifique as opções de importação

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Desabilitar a modificação das opções de importação pelo usuário de upload

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Descrição dos Modos

- Ignorar registros duplicados: Consulta os registros existentes com base no conteúdo do "Campo identificador". Se o registro já existir, esta linha é ignorada; se não existir, é importada como um novo registro.
- Atualizar registros duplicados: Consulta os registros existentes com base no conteúdo do "Campo identificador". Se o registro já existir, este registro é atualizado; se não existir, é importado como um novo registro.
- Apenas atualizar registros duplicados: Consulta os registros existentes com base no conteúdo do "Campo identificador". Se o registro já existir, este registro é atualizado; se não existir, é ignorado.

##### Campo Identificador

O sistema identifica se uma linha é um registro duplicado com base no valor deste campo.

- [Regra de Vinculação](/interface-builder/actions/action-settings/linkage-rule): Exibe/oculta botões dinamicamente;
- [Editar Botão](/interface-builder/actions/action-settings/edit-button): Edita o título, tipo e ícone do botão;