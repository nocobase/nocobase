---
pkg: '@nocobase/plugin-password-policy'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Política de Senha

## Introdução

Defina regras de senha, validade de senha e políticas de segurança de login para todos os usuários, além de gerenciar usuários bloqueados.

## Regras de Senha

![](https://static-docs.nocobase.com/202412281329313.png)

### Comprimento Mínimo da Senha

Defina o requisito de comprimento mínimo para senhas, com um comprimento máximo de 64 caracteres.

### Requisitos de Complexidade da Senha

As seguintes opções estão disponíveis:

- Deve conter letras e números
- Deve conter letras, números e símbolos
- Deve conter números, letras maiúsculas e minúsculas
- Deve conter números, letras maiúsculas e minúsculas, e símbolos
- Deve conter pelo menos 3 dos seguintes tipos de caracteres: números, letras maiúsculas, letras minúsculas e caracteres especiais
- Sem restrições

![](https://static-docs.nocobase.com/202412281331649.png)

### A Senha Não Pode Conter o Nome de Usuário

Defina se a senha pode ou não conter o nome de usuário atual.

### Histórico de Senhas

Lembre-se do número de senhas usadas recentemente pelo usuário. Os usuários não podem reutilizar essas senhas ao alterá-las. 0 significa sem restrição, com um máximo de 24 senhas.

## Configuração de Expiração de Senha

![](https://static-docs.nocobase.com/202412281335588.png)

### Período de Validade da Senha

O período de validade da senha do usuário. Os usuários devem alterar suas senhas antes que expirem para que o período de validade seja recalculado. Se a senha não for alterada antes da expiração, o usuário não conseguirá fazer login com a senha antiga e precisará da ajuda de um administrador para redefini-la. Se outros métodos de login estiverem configurados, o usuário ainda poderá fazer login por esses meios.

### Canal de Notificação de Expiração de Senha

Dentro de 10 dias antes da expiração da senha do usuário, um lembrete é enviado a cada login. Por padrão, o lembrete é enviado através do canal de mensagens internas "Lembrete de Expiração de Senha", que pode ser gerenciado na seção de gerenciamento de notificações.

### Recomendações de Configuração

Como a expiração da senha pode impedir o login em contas, incluindo as de administrador, é recomendável alterar as senhas prontamente e configurar várias contas no sistema que tenham autoridade para modificar senhas de usuário.

## Segurança de Login por Senha

Defina limites para tentativas de login com senha inválida.

![](https://static-docs.nocobase.com/202412281339724.png)

### Número Máximo de Tentativas de Login com Senha Inválida

Defina o número máximo de tentativas de login que um usuário pode fazer dentro de um intervalo de tempo especificado.

### Intervalo de Tempo Máximo para Tentativas de Login Inválidas (Segundos)

Defina o intervalo de tempo (em segundos) para calcular o número máximo de tentativas de login inválidas por um usuário.

### Duração do Bloqueio (Segundos)

Defina a duração pela qual um usuário é bloqueado após exceder o limite de tentativas de login com senha inválida (0 significa sem restrição). Durante o período de bloqueio, o usuário será impedido de acessar o sistema por qualquer método de autenticação, incluindo chaves de API. Se for necessário desbloquear o usuário manualmente, consulte [Bloqueio de Usuário](./lockout.md).

### Cenários

#### Sem Restrições

Não há restrições quanto ao número de tentativas de senha inválida por parte dos usuários.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Limitar Frequência de Tentativas, Não Bloquear Usuário

Exemplo: Um usuário pode tentar fazer login até 5 vezes a cada 5 minutos.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Bloquear Usuário Após Exceder o Limite

Exemplo: Se um usuário fizer 5 tentativas consecutivas de login com senha inválida em 5 minutos, ele será bloqueado por 2 horas.

![](https://static-docs.nocobase.com/202412281344952.png)

### Recomendações de Configuração

- A configuração do número de tentativas de login com senha inválida e do intervalo de tempo é geralmente usada para limitar tentativas de login de alta frequência em um curto período, prevenindo ataques de força bruta.
- Se o usuário deve ser bloqueado após exceder o limite, isso deve ser considerado com base nos cenários de uso reais. A configuração da duração do bloqueio pode ser explorada maliciosamente, pois atacantes podem inserir intencionalmente senhas incorretas várias vezes para uma conta-alvo, forçando o bloqueio da conta e tornando-a inutilizável. Isso pode ser mitigado combinando restrições de IP, limites de taxa de API e outras medidas.
- Como o bloqueio de conta impede o acesso ao sistema, incluindo contas de administrador, é aconselhável configurar várias contas no sistema que tenham autoridade para desbloquear usuários.