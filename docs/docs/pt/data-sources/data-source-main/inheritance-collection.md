---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Coleção de Herança

## Introdução

:::warning
Suportado apenas quando o banco de dados principal for PostgreSQL.
:::

Você pode criar uma coleção pai e derivar coleções filhas a partir dela. A coleção filha herdará a estrutura da coleção pai e também poderá definir suas próprias colunas. Este padrão de design ajuda a organizar e gerenciar dados com estruturas semelhantes, mas que podem ter algumas diferenças.

Aqui estão algumas características comuns das coleções de herança:

- Coleção Pai: A coleção pai contém colunas e dados comuns, definindo a estrutura básica de toda a hierarquia de herança.
- Coleção Filha: A coleção filha herda a estrutura da coleção pai, mas também pode definir suas próprias colunas. Isso permite que cada coleção filha tenha as propriedades comuns da coleção pai, ao mesmo tempo em que contém atributos específicos da subclasse.
- Consulta: Ao consultar, você pode optar por consultar toda a hierarquia de herança, apenas a coleção pai ou uma coleção filha específica. Isso permite que diferentes níveis de dados sejam recuperados e processados conforme necessário.
- Relacionamento de Herança: Um relacionamento de herança é estabelecido entre a coleção pai e a coleção filha, o que significa que a estrutura da coleção pai pode ser usada para definir atributos consistentes, enquanto permite que a coleção filha estenda ou substitua esses atributos.

Este padrão de design ajuda a reduzir a redundância de dados, simplificar o modelo de banco de dados e tornar os dados mais fáceis de manter. No entanto, ele precisa ser usado com cautela, pois as coleções de herança podem aumentar a complexidade das consultas, especialmente ao lidar com toda a hierarquia de herança. Sistemas de banco de dados que suportam coleções de herança geralmente fornecem sintaxe e ferramentas específicas para gerenciar e consultar essas estruturas de coleção.

## Manual do Usuário

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)