---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



pkg: '@nocobase/plugin-ip-restriction'
---

# Restrições de IP

## Introdução

O NocoBase permite que administradores configurem listas de permissão (whitelists) ou listas de bloqueio (blacklists) para os IPs de acesso de usuários. Isso ajuda a restringir conexões de rede externas não autorizadas ou a bloquear endereços IP maliciosos conhecidos, reduzindo assim os riscos de segurança. Além disso, você pode consultar os logs de acesso negado para identificar IPs de risco.

## Regras de Configuração

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Modos de Filtragem de IP

- **Lista de Bloqueio (Blacklist)**: Quando o IP de acesso de um usuário corresponde a um IP na lista, o sistema **negará** o acesso; IPs não correspondentes são **permitidos** por padrão.
- **Lista de Permissão (Whitelist)**: Quando o IP de acesso de um usuário corresponde a um IP na lista, o sistema **permitirá** o acesso; IPs não correspondentes são **negados** por padrão.

### Lista de IPs

Usada para definir os endereços IP que têm acesso permitido ou negado ao sistema. Sua função específica depende do modo de filtragem de IP selecionado. Você pode inserir endereços IP ou segmentos de rede CIDR, com múltiplos endereços separados por vírgulas ou quebras de linha.

## Consultar Logs

Após um usuário ter o acesso negado, o IP de acesso é registrado nos logs do sistema, e o arquivo de log correspondente pode ser baixado para análise.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Exemplo de Log:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Recomendações de Configuração

### Recomendações para o Modo Lista de Bloqueio

- Adicione endereços IP maliciosos conhecidos para prevenir potenciais ataques de rede.
- Verifique e atualize regularmente a lista de bloqueio, removendo endereços IP inválidos ou que não precisam mais ser bloqueados.

### Recomendações para o Modo Lista de Permissão

- Adicione endereços IP de redes internas confiáveis (como segmentos de rede de escritório) para garantir o acesso seguro aos sistemas centrais.
- Evite incluir endereços IP atribuídos dinamicamente na lista de permissão para evitar interrupções de acesso.

### Recomendações Gerais

- Use segmentos de rede CIDR para simplificar a configuração, como usar 192.168.0.0/24 em vez de adicionar endereços IP individualmente.
- Faça backup regularmente das configurações da lista de IPs para se recuperar rapidamente de operações incorretas ou falhas do sistema.
- Monitore regularmente os logs de acesso para identificar IPs anormais e ajuste as listas de bloqueio ou permissão prontamente.