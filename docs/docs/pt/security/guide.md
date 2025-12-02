:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Guia de Segurança do NocoBase

O NocoBase foca na segurança de dados e aplicações, desde o design funcional até a implementação do sistema. A plataforma possui diversas funções de segurança integradas, como autenticação de usuário, controle de acesso e criptografia de dados, além de permitir a configuração flexível de políticas de segurança conforme suas necessidades. Seja para proteger dados de usuários, gerenciar permissões de acesso ou isolar ambientes de desenvolvimento e produção, o NocoBase oferece ferramentas e soluções práticas. Este guia tem como objetivo fornecer orientações para o uso seguro do NocoBase, ajudando você a proteger seus dados, aplicações e ambiente, garantindo o uso eficiente das funções do sistema com segurança.

## Autenticação de Usuário

A autenticação de usuário é usada para identificar a identidade do usuário, impedir que usuários não autorizados acessem o sistema e garantir que as identidades dos usuários não sejam usadas indevidamente.

### Chave do Token

Por padrão, o NocoBase usa JWT (JSON Web Token) para autenticação das APIs do lado do servidor. Você pode definir a chave do Token através da variável de ambiente do sistema `APP_KEY`. Gerencie adequadamente a chave do Token da sua aplicação para evitar vazamentos externos. É importante notar que, se a `APP_KEY` for modificada, os Tokens antigos também se tornarão inválidos.

### Política de Token

O NocoBase permite configurar as seguintes políticas de segurança para os Tokens de usuário:

| Item de Configuração        | Descrição