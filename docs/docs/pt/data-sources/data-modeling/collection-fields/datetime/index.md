---
title: "Visão geral"
description: "Tipos de campos de data e hora: com fuso horário/sem fuso horário, data, hora, timestamp Unix e correspondência entre os tipos do NocoBase/MySQL/PostgreSQL."
keywords: "data e hora,DateTime,campo de hora,com fuso horário,sem fuso horário,timestamp Unix,NocoBase"
---

# Visão geral

## Tipos de campos de data e hora

Os tipos de campos de data e hora incluem os seguintes:

- **Data e hora (com fuso horário)** - A data e hora são convertidas uniformemente para o horário UTC (Tempo Universal Coordenado) e convertidas para o fuso horário quando necessário;
- **Data e hora (sem fuso horário)** - Armazena a data e a hora sem informações de fuso horário;
- **Data (sem hora)** - Armazena apenas a data, sem a parte referente à hora;
- **Hora** - Armazena apenas a hora, sem a parte referente à data;
- **Timestamp Unix** - Armazena um timestamp Unix, normalmente como o número de segundos desde 1º de janeiro de 1970.

Exemplos dos tipos de campos relacionados a data:

| **Tipo de campo**         | **Valor de exemplo**                 | **Descrição**                                   |
|--------------------|---------------------------|--------------------------------------------|
| Data e hora (com fuso horário)    | 2024-08-24T07:30:00.000Z   | A data e hora são convertidas uniformemente para o horário UTC (Tempo Universal Coordenado)      |
| Data e hora (sem fuso horário)  | 2024-08-24 15:30:00        | Data e hora sem fuso horário, registrando apenas a data e a hora             |
| Data (sem hora)     | 2024-08-24                 | Armazena apenas a informação da data, sem incluir a hora                     |
| Hora               | 15:30:00                   | Armazena apenas a informação da hora, sem incluir a data                     |
| Timestamp Unix        | 1724437800                 | Número de segundos decorridos desde 00:00:00 de 1º de janeiro de 1970 no horário UTC |

## Correspondência entre fontes de dados

Tabela de correspondência entre NocoBase, MySQL e PostgreSQL:

| **Tipo de campo**       | **NocoBase**               | **MySQL**          | **PostgreSQL**                |
|------------------|-----------------------------|--------------------|-------------------------------|
| Data e hora (com fuso horário)   | Datetime with timezone    | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE      |
| Data e hora (sem fuso horário)  | Datetime without timezone  | DATETIME           | TIMESTAMP WITHOUT TIME ZONE   |
| Data (sem hora)     | Date                      | DATE                 | DATE                          |
| Hora               | Time                     | TIME                 | TIME WITHOUT TIME ZONE        |
| Timestamp Unix        | Unix timestamp            | INTEGER<br/>BIGINT   | INTEGER<br/>BIGINT              |
| Hora (com fuso horário)      | -                         | -                  | TIME WITH TIME ZONE           |

Observação:
- O intervalo de dados do TIMESTAMP do MySQL está entre o horário UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`. Quando esse intervalo for excedido, recomenda-se usar DATETIME ou BIGINT para armazenar o timestamp Unix.

## Processo de armazenamento de data e hora

### Com fuso horário

Inclui`日期时间（不含时区）`e `Unix 时间戳`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Observação:
- Para oferecer suporte a um intervalo de dados mais amplo, o campo de data e hora (com fuso horário) do NocoBase usa DATETIME no banco de dados MySQL. O valor de data armazenado é convertido de acordo com a variável de ambiente TZ do servidor. Se a variável de ambiente TZ for alterada, o valor armazenado da data e hora também será alterado.
- Existe uma diferença de fuso horário entre o horário UTC e o horário local; exibir diretamente o valor UTC original pode causar confusão aos usuários.

### Sem fuso horário

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Tempo Universal Coordenado, Coordinated Universal Time) é o padrão mundial de tempo usado para coordenar e unificar os horários em diferentes partes do mundo. Ele é baseado em um padrão de tempo de alta precisão fornecido por relógios atômicos e permanece sincronizado com o tempo de rotação da Terra.

Existe uma diferença de fuso horário entre o horário UTC e o horário local; exibir diretamente o valor UTC original pode causar confusão aos usuários, por exemplo:

| **Fuso horário**       | **Data e hora**                      |
|----------------|----------------------------------|
| UTC            | 2024-08-24T07:30:00.000Z          |
| Fuso UTC+8 | 2024-08-24 15:30:00               |
| Fuso UTC+5 | 2024-08-24 12:30:00               |
| Fuso UTC-5 | 2024-08-24 02:30:00               |
| Horário do Reino Unido (UTC+0) | 2024-08-24 07:30:00              |
| Horário Central (UTC-6) | 2024-08-23 01:30:00              |

Todos os valores acima representam o mesmo momento; apenas os fusos horários são diferentes.
