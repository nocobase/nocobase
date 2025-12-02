:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

## Tipos de Campo de Data e Hora

Os tipos de campo de data e hora podem ser categorizados da seguinte forma:

- **Data e Hora (com fuso horário)**: Esses valores são padronizados para UTC (Tempo Universal Coordenado) e podem ser ajustados para diferentes fusos horários quando necessário;
- **Data e Hora (sem fuso horário)**: Armazena dados de data e hora sem incluir informações de fuso horário;
- **Data (sem hora)**: Armazena exclusivamente informações de data, omitindo qualquer componente de hora;
- **Hora**: Armazena apenas informações de hora, excluindo a data;
- **Timestamp Unix**: Representa o número de segundos decorridos desde 1º de janeiro de 1970 e é armazenado como um timestamp Unix.

Aqui estão exemplos para cada tipo de campo relacionado a Data e Hora:

| **Tipo de Campo**             | **Valor de Exemplo**       | **Descrição**                                          |
|-------------------------------|----------------------------|--------------------------------------------------------|
| Data e Hora (com fuso horário) | 2024-08-24T07:30:00.000Z   | Convertido para UTC e pode ser ajustado para fusos horários |
| Data e Hora (sem fuso horário) | 2024-08-24 15:30:00        | Armazena data e hora sem considerar o fuso horário     |
| Data (sem hora)               | 2024-08-24                 | Captura apenas a data, sem informações de hora         |
| Hora                          | 15:30:00                   | Captura apenas a hora, excluindo detalhes da data      |
| Timestamp Unix                | 1724437800                 | Representa os segundos desde 01-01-1970 00:00:00 UTC   |

## Comparações entre Fontes de Dados

Abaixo está uma tabela de comparação para NocoBase, MySQL e PostgreSQL:

| **Tipo de Campo**             | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|-------------------------------|----------------------------|----------------------------|----------------------------------------|
| Data e Hora (com fuso horário) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Data e Hora (sem fuso horário) | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Data (sem hora)               | Date                       | DATE                       | DATE                                   |
| Hora                          | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Timestamp Unix                | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Hora (com fuso horário)       | -                          | -                          | TIME WITH TIME ZONE                    |

**Observação:**
- O tipo TIMESTAMP do MySQL abrange um intervalo entre `1970-01-01 00:00:01 UTC` e `2038-01-19 03:14:07 UTC`. Para datas e horas fora desse intervalo, é recomendado usar DATETIME ou BIGINT para armazenar timestamps Unix.

## Fluxo de Processamento para Armazenamento de Data e Hora

### Com Fuso Horário

Isso inclui `Data e Hora (com fuso horário)` e `Timestamp Unix`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Observação:**
- Para acomodar um intervalo mais amplo de datas, o NocoBase utiliza o tipo DATETIME no MySQL para campos de Data e Hora (com fuso horário). O valor da data armazenado é convertido com base na variável de ambiente TZ do servidor, o que significa que, se essa variável for alterada, o valor de Data e Hora armazenado também será modificado.
- Como existe uma diferença de fuso horário entre o UTC e a hora local, exibir diretamente o valor UTC bruto pode levar a confusão para o usuário.

### Sem Fuso Horário

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Tempo Universal Coordenado) é o padrão global de tempo utilizado para coordenar e sincronizar a hora em todo o mundo. É um padrão de tempo de alta precisão, mantido por relógios atômicos e sincronizado com a rotação da Terra.

A diferença entre o UTC e a hora local pode causar confusão ao exibir os valores brutos de UTC. Por exemplo:

| **Fuso Horário** | **Data e Hora**                   |
|------------------|-----------------------------------|
| UTC              | 2024-08-24T07:30:00.000Z          |
| UTC+8            | 2024-08-24 15:30:00               |
| UTC+5            | 2024-08-24 12:30:00               |
| UTC-5            | 2024-08-24 02:30:00               |
| UTC+0            | 2024-08-24 07:30:00               |
| UTC-6            | 2024-08-23 01:30:00               |

Todos esses horários representam o mesmo momento, apenas expressos em diferentes fusos horários.