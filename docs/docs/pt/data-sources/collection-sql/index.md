---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



pkg: "@nocobase/plugin-collection-sql"
---

# Coleção SQL

## Introdução

A coleção SQL oferece um método poderoso para recuperar dados usando consultas SQL. Ao extrair campos de dados por meio de consultas SQL e configurar os metadados de campo associados, você pode utilizar esses campos como se estivesse trabalhando com uma tabela padrão. Este recurso é particularmente benéfico para cenários que envolvem consultas de junção complexas, análise estatística e muito mais.

## Manual do Usuário

### Criando uma Nova Coleção SQL

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

<p>1. Digite sua consulta SQL na caixa de entrada fornecida e clique em Executar. O sistema analisará a consulta para determinar as tabelas e os campos envolvidos, extraindo automaticamente os metadados de campo relevantes das tabelas de origem.</p>

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

<p>2. Se a análise do sistema sobre as tabelas e campos de origem estiver incorreta, você pode selecionar manualmente as tabelas e os campos apropriados para garantir que os metadados corretos sejam usados. Comece selecionando a tabela de origem e, em seguida, escolha os campos correspondentes na seção de origem do campo abaixo.</p>

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

<p>3. Para campos que não possuem uma origem direta, o sistema inferirá o tipo de campo com base no tipo de dado. Se essa inferência estiver incorreta, você pode selecionar manualmente o tipo de campo adequado.</p>

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

<p>4. Enquanto você configura cada campo, você pode visualizar sua exibição na área de pré-visualização, permitindo que você veja o impacto imediato de suas configurações.</p>

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

<p>5. Após concluir a configuração e confirmar que tudo está correto, clique no botão Confirmar abaixo da caixa de entrada SQL para finalizar o envio.</p>

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Editando

1. Se você precisar modificar a consulta SQL, clique no botão Editar para alterar diretamente a instrução SQL e reconfigurar os campos conforme necessário.

2. Para ajustar os metadados do campo, use a opção Configurar Campos, que permite atualizar as configurações do campo como faria para uma tabela comum.

### Sincronização

Se a consulta SQL permanecer inalterada, mas a estrutura da tabela do banco de dados subjacente tiver sido modificada, você pode sincronizar e reconfigurar os campos selecionando Configurar Campos - Sincronizar do Banco de Dados.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Coleção SQL vs. Views de Banco de Dados Vinculadas

| Tipo de Modelo               | Melhor para                                                                                                                              | Método de Implementação | Suporte a Operações CRUD |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- | :----------------------- |
| SQL                          | Modelos simples, casos de uso leves<br />Interação limitada com o banco de dados<br />Evitar a manutenção de views<br />Preferência por operações via UI | Subconsulta SQL         | Não Suportado            |
| View de Banco de Dados Vinculada | Modelos complexos<br />Requer interação com o banco de dados<br />Modificação de dados necessária<br />Requer suporte de banco de dados mais robusto e estável | View de Banco de Dados  | Parcialmente Suportado   |

:::warning
Ao usar uma coleção SQL, certifique-se de selecionar tabelas que sejam gerenciáveis dentro do NocoBase. Usar tabelas do mesmo banco de dados que não estão conectadas ao NocoBase pode levar a uma análise imprecisa da consulta SQL. Se isso for uma preocupação, considere criar e vincular a uma view.
:::