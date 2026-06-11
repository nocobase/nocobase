# Como Fazer Deploy do NocoBase Mais Rapidamente

Muitos amigos, ao fazer deploy do NocoBase, sentem que a velocidade de acesso não é ideal. Isso geralmente é causado pelo ambiente de rede, configuração do servidor ou arquitetura de deploy. Antes de apresentar técnicas de otimização, mostro a velocidade de acesso de referência do NocoBase em configuração normal, para evitar preocupações desnecessárias.

### Velocidade Normal de Carregamento do NocoBase

Aqui estão os tempos testados no ambiente demo do NocoBase:

- Tempo da entrada da URL ao primeiro carregamento da aplicação: cerca de 2 segundos
- Tempo de troca entre páginas dentro da aplicação: cerca de 50-300 milissegundos

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

A seguir, vou compartilhar uma série de técnicas simples mas eficientes de otimização de deploy. Esses métodos não exigem mudanças no código — basta ajustar as configurações de deploy para melhorar significativamente a velocidade de acesso:

## I. Otimização de Rede e Infraestrutura

### 1. Versão do Protocolo HTTP: Adote HTTP/2 Sem Esforço

【Pré-requisitos】

- **Necessário suporte HTTPS**: importante! Quase todos os navegadores modernos só suportam HTTP/2 em conexões HTTPS, então você precisa configurar SSL primeiro.
- **Requisitos do servidor**: você precisa usar software de servidor que suporte HTTP/2, como Nginx 1.9.5+ ou Apache 2.4.17+.
- **Versão TLS**: recomenda-se TLS 1.2 ou superior (idealmente TLS 1.3); versões antigas de SSL não suportam HTTP/2.

【Dica】

O HTTP/1.1 tradicional tem limitações ao tratar várias requisições — geralmente apenas 6-8 conexões simultâneas, como uma fila para comprar ingressos, causando atraso.
![250409http1](https://static-docs.nocobase.com/250409http1.png)

O HTTP/2 usa "multiplexação", podendo tratar várias requisições ao mesmo tempo, acelerando muito o carregamento de recursos. E o HTTP/3, mais novo, se sai melhor em redes instáveis.

![250409http2](https://static-docs.nocobase.com/250409http2.png)

【Sugestão】

- Garanta que seu servidor web tem HTTP/2 ativado; a maioria dos servidores (Nginx, Caddy) configura facilmente.
- No Nginx, basta adicionar `http2` à diretiva listen:

```nginx
listen 443 ssl http2;
```

【Validação】

No painel de desenvolvedor do navegador, abra «Network», clique com o botão direito e marque «Protocolo» — você verá a versão do protocolo da conexão atual:
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

Em nossos testes, o ganho geral foi cerca de 10%; em sistemas com muitos blocos e recursos, o ganho é mais notável.

### 2. Largura de Banda: Maior é Melhor, Cobrança Flexível

【Dica】

Como uma rodovia melhor que uma estrada lenta, a largura de banda determina a eficiência da transferência de dados. Quando o NocoBase carrega pela primeira vez, baixa muitos recursos de frontend; banda insuficiente vira gargalo.

【Sugestão】

- Escolha banda suficiente (recomenda-se 50M+ se houver muitos usuários); não economize esse recurso crítico.
- Recomenda-se «cobrança por tráfego»: muitos provedores cloud oferecem esse modelo flexível, em horários de pico você tem maior banda e em horários normais controla os custos.

### 3. Latência de Rede e Localização Geográfica do Servidor: Perto é Mais Rápido

【Dica】

A latência é o tempo de espera da transferência de dados. Mesmo com banda suficiente, se o servidor está longe do usuário (usuário na China, servidor nos EUA), cada requisição demora mais.

【Sugestão】

- Tente fazer deploy do NocoBase em região próxima dos seus principais usuários.
- Se seus usuários estão pelo mundo, considere serviços de aceleração global (Alibaba Cloud Global Acceleration, AWS Global Accelerator) para otimizar o roteamento e reduzir a latência.

【Validação】

Use ping para testar a latência de servidores em regiões diferentes.
Esse ganho é o mais notável: a velocidade de acesso melhora 1-3 vezes ou mais conforme a região.
12 fusos horários de distância, 13 segundos:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)

2 fusos de distância, 8 segundos:
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

Mesma região, cerca de 3 segundos:
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. Otimização da Arquitetura de Deploy

### 4. Deploy Servidor e Modo de Proxy: Escolha a Arquitetura Adequada

【Pré-requisitos】

- **Permissão do servidor**: você precisa ter root ou sudo no servidor para configurar Nginx etc.
- **Habilidade básica**: precisa de algum conhecimento básico de configuração de servidor; mas calma, vou dar exemplos.
- **Acesso a portas**: garanta que o firewall permite porta 80 (HTTP) e 443 (HTTPS).

【Dica】

Quando o usuário acessa o NocoBase, a requisição chega direto ao seu servidor. Um deploy adequado faz o servidor tratar requisições de forma mais eficiente, oferecendo respostas mais rápidas.

【Soluções e sugestões】

**Iniciar NocoBase sem proxy reverso para recursos estáticos (não recomendado):**

- Desvantagem: simples, mas com desempenho ruim em concorrência alta ou arquivos estáticos; adequado para desenvolvimento e testes;
- Sugestão: evite esse modo.

> Ver «[Documentação de Instalação](https://docs.nocobase.com/cn/get-started/quickstart)»

Sem proxy reverso, o carregamento da home leva cerca de 6,1 segundos
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**Usar Nginx / Caddy como proxy reverso (fortemente recomendado):**

- Vantagem: o servidor de proxy reverso trata conexões concorrentes com eficiência, serve arquivos estáticos, faz balanceamento de carga e configura HTTP/2 facilmente;
- Sugestão: em produção, após o deploy da aplicação (deploy por código-fonte / create-nocobase-app / imagem Docker), use Nginx ou Caddy como proxy reverso.

> Ver «[Documentação de Deploy](https://docs.nocobase.com/cn/get-started/deployment/production)»

Com proxy Nginx, o carregamento da home leva cerca de 3-4 segundos
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250407192453](https://static-docs.nocobase.com/20250407192453.png)

**Cluster e balanceamento de carga (cenários de alta concorrência e alta disponibilidade):**

- Vantagem: com várias instâncias tratando as requisições, melhora muito a estabilidade e capacidade concorrente do sistema;
- Veja como fazer: **[Modo Cluster](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)**

### 5. Usar CDN para Acelerar Recursos Estáticos

【Pré-requisitos】

- **Domínio**: você precisa de um domínio registrado e gerenciar seu DNS.
- **Certificado SSL**: a maioria dos serviços CDN exige SSL configurado (use o gratuito Let's Encrypt).
- **Escolha do serviço**: escolha o provedor adequado conforme a região (usuários na China continental precisam de CDN com ICP).

【Dica】

A CDN (Content Delivery Network) cacheia seus recursos estáticos em nós ao redor do mundo; o usuário pega do nó mais próximo, como pegar água de uma fonte próxima, reduzindo muito a latência.

Além disso, a maior vantagem da CDN é **reduzir significativamente a carga e a banda do servidor da aplicação**. Quando muitos usuários acessam o NocoBase ao mesmo tempo, sem CDN, todas as requisições de recursos estáticos (JavaScript, CSS, imagens, etc.) vão direto ao seu servidor, podendo gerar gargalo de banda, queda de desempenho e até crash. Com CDN, seu servidor pode focar em lógica de negócio, oferecendo experiência mais estável.

![202504071845_cdn](https://static-docs.nocobase.com/202504071845_cdn.png)

【Sugestão】 • Configure seu servidor para que requisições de recursos estáticos sejam distribuídas via CDN; • Escolha o provedor de CDN conforme a região do usuário:

- Globais: Cloudflare, Akamai, AWS CloudFront;
- China continental: Alibaba Cloud CDN, Tencent Cloud CDN, Baidu Cloud Acceleration. Exemplo de configuração:

```nginx
# Redireciona recursos estáticos para o domínio CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

Para projetos pequenos, o plano grátis da Cloudflare também oferece bom efeito de CDN:

1. Crie conta na Cloudflare e adicione seu domínio;
2. Mude o DNS apontando seu domínio para os servidores da Cloudflare;
3. No painel, configure o nível adequado de cache.

**Atenção especial**: mesmo com usuários todos na mesma região, ainda recomendamos fortemente CDN — reduz a carga do servidor e melhora a estabilidade geral, especialmente em volumes altos.

## III. Otimização de Recursos Estáticos

### 6. Compressão e Configuração de Cache no Servidor

【Pré-requisitos】

- **Recursos de CPU**: compressão aumenta a carga da CPU; seu servidor precisa de capacidade.
- **Suporte de módulo Nginx**: Gzip geralmente é embutido, mas Brotli pode exigir módulo extra.
- **Permissão de configuração**: precisa poder modificar a configuração do servidor.

【Dica】

Habilitando compressão e estratégia razoável de cache, dá para reduzir significativamente o volume de dados transferidos e requisições repetidas — como dar um «emagrecimento» nos seus recursos, fazendo o carregamento voar.
![20250409175241](https://static-docs.nocobase.com/20250409175241.png)

【Sugestão】

- Solução mais simples: usar o CDN grátis da Cloudflare, que ativa Gzip automaticamente.
- Ative Gzip ou Brotli; no Nginx assim:

```nginx
# Ativa Gzip
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Se suporta Brotli, ative para compressão mais eficiente
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

• Configure cache headers adequados para recursos estáticos, reduzindo recargas repetidas:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. Use SSL/TLS e Otimize o Desempenho

【Pré-requisitos】

- **Certificado SSL**: você precisa de um certificado válido (use o gratuito Let's Encrypt).
- **Permissão**: precisa modificar a config SSL.
- **DNS**: configure resolvers DNS confiáveis para OCSP Stapling.

【Dica】

Segurança vem em primeiro lugar, mas se HTTPS não for bem configurado, pode adicionar latência. Aqui vão dicas para garantir segurança e desempenho.

【Sugestão】

- Use TLS 1.3, a versão TLS mais rápida atualmente. No Nginx:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- Ative OCSP Stapling para reduzir o tempo de validação do certificado:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- Use reuso de sessão para reduzir handshakes repetidos:

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

【Efeito de otimização em cenário internacional】
**Atenção especial**: os efeitos abaixo são em cenário cross-border / 12 fusos de distância — diferente do cenário local (cerca de 3 segundos). A latência por distância geográfica é inevitável, mas dá para melhorar muito:

Aplicando Http2 + cache CDN + Gzip + Brotli:
Antes (acesso internacional), 13 segundos:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)
Depois (acesso internacional), 8 segundos:
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

Esse exemplo mostra que mesmo geograficamente longe, otimizações razoáveis reduzem o tempo em cerca de 40%, melhorando muito a experiência.

## IV. Monitoramento e Diagnóstico

### 8. Monitoramento de Desempenho e Análise Básica

【Pré-requisitos】

- **Acessibilidade**: seu site precisa ser publicamente acessível para a maioria das ferramentas online.
- **Habilidade básica**: precisa entender o significado das métricas, mas vamos explicar cada uma.

【Dica】

Sem saber onde está o gargalo, é difícil otimizar com precisão. Sugerimos usar ferramentas grátis de monitoramento para encontrar os problemas.

【Sugestão】

**Use as ferramentas grátis abaixo para verificar o desempenho:**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**Atenção a essas métricas-chave:**

- Tempo de carregamento da página
- Tempo de resposta do servidor
- Tempo de resolução DNS
- Tempo de handshake SSL

**Soluções para problemas comuns:**

- DNS lento? Considere mudar o serviço DNS ou ativar pré-resolução de DNS.
- Handshake SSL lento? Otimize SSL, ative reuso de sessão.
- Resposta do servidor lenta? Verifique recursos do servidor; se necessário, faça upgrade.
- Recursos estáticos lentos? Tente CDN e ajustes de cache.

## Checklist Rápido de Otimização de Deploy

Use o checklist abaixo para verificar e otimizar rapidamente o deploy do NocoBase:

1. **Verificação da versão HTTP**

   - [ ] HTTPS habilitado (pré-requisito do HTTP/2)
   - [ ] HTTP/2 habilitado
   - [ ] Se possível, considere suporte a HTTP/3
2. **Avaliação de banda**

   - [ ] Banda suficiente (mínimo 10Mbps; preferível 50Mbps+)
   - [ ] Considere cobrança por tráfego em vez de banda fixa
3. **Localização do servidor**

   - [ ] Servidor próximo aos usuários
   - [ ] Para usuários globais, considere serviço de aceleração global
4. **Arquitetura de deploy**

   - [ ] Use Nginx/Caddy como proxy reverso, separando recursos estáticos da API
   - [ ] Se necessário, faça deploy multi-instância com balanceamento de carga
5. **Implementação de CDN**

   - [ ] Acelere recursos estáticos via CDN
   - [ ] Configure estratégia de cache adequada
   - [ ] Garanta que a CDN suporta HTTP/2 ou HTTP/3
6. **Compressão e cache**

   - [ ] Ative Gzip ou Brotli
   - [ ] Configure cache headers do navegador adequadamente
7. **Otimização SSL/TLS**

   - [ ] Use TLS 1.3 para handshake mais rápido
   - [ ] Ative OCSP Stapling
   - [ ] Configure reuso de sessão SSL
8. **Monitoramento**

   - [ ] Avalie o site com ferramentas de teste de desempenho periodicamente
   - [ ] Monitore métricas-chave (carregamento, resposta, resolução, handshake)
   - [ ] Otimize conforme os problemas

## FAQ

【P】Meu servidor está fora da China, e o acesso de usuários chineses é lento. O que fazer?

【R】O melhor é mudar para um servidor cloud na China. Se for impossível, você ainda pode:

1. Usar CDN local para acelerar recursos estáticos;
2. Usar serviços de aceleração global para otimizar rotas;
3. Habilitar todas as compressões e otimizações de cache possíveis.

【P】Por que o primeiro carregamento do meu NocoBase é lento, mas depois fica rápido?

【R】Primeiro carregamento lento é normal: requer baixar muitos recursos. Em nosso Demo oficial, geralmente o primeiro carregamento leva cerca de 3 segundos.

Em uso diário, abrir a aplicação digitando a URL leva 1-2 segundos, e mudar de página dentro da aplicação leva 50-300 milissegundos — latência muito baixa.

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

Se o tempo de carregamento for excessivo, ainda há espaço para otimizar:

1. Garanta que HTTP/2 está habilitado;
2. Implemente CDN;
3. Habilite Gzip/Brotli;
4. Verifique se a banda do servidor é suficiente.

【P】Uso hospedagem virtual e não consigo modificar a config do Nginx, o que faço?

【R】Nesse caso, há menos opções, mas ainda dá para:

1. Tentar usar serviço de CDN (Cloudflare);
2. Otimizar parâmetros ajustáveis na aplicação;
3. Se possível, considere upgrade para VPS com mais opções de configuração.

---

Com essas estratégias simples mas práticas, você consegue melhorar significativamente a velocidade de acesso ao NocoBase, oferecendo uma experiência mais fluida. Muitas otimizações se completam em poucas horas, sem mudar o código — você verá os efeitos rapidinho.
