---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# União de Papéis

A União de Papéis é um modo de gerenciamento de permissões. De acordo com as configurações do sistema, os desenvolvedores podem escolher usar papéis independentes, permitir a união de papéis ou usar apenas a união de papéis, para atender a diferentes requisitos de permissão.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Papéis Independentes

Por padrão, o sistema usa papéis independentes: ele não utiliza a união de papéis, e os usuários precisam alternar individualmente entre os papéis que possuem.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Permitir União de Papéis

Permite que os desenvolvedores do sistema usem a união de papéis, o que significa que os usuários podem ter as permissões de todos os papéis que possuem simultaneamente, e também podem alternar entre seus papéis individualmente.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Apenas União de Papéis

Força os usuários a usar apenas a união de papéis, sem a possibilidade de alternar entre eles individualmente.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Regras para União de Papéis

A união de papéis concede as permissões máximas de todos os papéis. Abaixo, explicamos como as permissões são determinadas quando há conflitos de configuração para o mesmo item entre diferentes papéis.

### Fusão de Permissões de Operação

Exemplo: O Papel 1 (role1) está configurado para 'Permitir configurar interface' e o Papel 2 (role2) está configurado para 'Permitir instalar, ativar e desativar plugins'.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Ao fazer login com o papel de **Todas as Permissões**, o usuário terá ambas as permissões simultaneamente.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Fusão de Escopo de Dados

#### Linhas de Dados

Cenário 1: Múltiplos papéis definindo condições no mesmo campo

Papel A, condição configurada: Idade < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Papel B, condição configurada: Idade > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Após a união:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Cenário 2: Diferentes papéis definindo condições em campos diferentes

Papel A, condição configurada: Idade < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Papel B, condição configurada: Nome contém "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Após a união:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Colunas de Dados

Papel A, campos visíveis configurados: Nome, Idade

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Papel B, campos visíveis configurados: Nome, Sexo

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Após a união:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Linhas e Colunas Mistas

Papel A, condição configurada: Idade < 30, campos visíveis: Nome, Idade

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Papel B, condição configurada: Nome contém "Ja", campos visíveis: Nome, Sexo

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Após a união:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Observação:** As células com fundo vermelho indicam dados que não eram visíveis em papéis individuais, mas se tornaram visíveis no papel unificado.

#### Resumo

Regras de união de papéis para escopo de dados:

1.  Entre linhas, se qualquer condição for satisfeita, a linha tem permissão.
2.  Entre colunas, os campos são combinados.
3.  Quando linhas e colunas são configuradas simultaneamente, elas são unidas separadamente (linhas com linhas, colunas com colunas), e não como combinações de (linha + coluna) com (linha + coluna).