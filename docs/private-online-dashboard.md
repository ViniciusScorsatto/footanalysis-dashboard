# Dashboard privado no Railway

## Escopo e arquitetura

Uma réplica, um volume `/data`, SQLite/WAL e dois processos supervisionados: HTTP e worker. Apenas Shorts animados/estáticos PT e EN. O Studio, publicação, thumbnails, longos e pedidos públicos não são disponibilizados. O desenvolvimento local continua com `npm run dev`.

O Player e o renderer usam `src/online/ShortVideo.tsx`. A preparação cria um snapshot; o endpoint de render recebe seu `previewId`, retorna 202 e não espera a renderização. Cada entrada da fila possui uma cópia independente do job. Uma nova preparação não altera um render ativo. Nations League usa duas tabelas por página, seis segundos por página e mantém o áudio em loop da composição.

Jobs aguardando sobrevivem a reinícios. Renders interrompidos ficam como falhos (ou cancelados quando solicitado) e exigem nova tentativa manual. Concorrência: um job e um frame por vez. Limite: 20 jobs ativos; timeout por render: 30 minutos. Cancelamento é consultado a cada 500 ms durante o render.

## Primeiro deploy — executar somente quando autorizado

1. Conectar o repositório/branch aprovado a um serviço Railway usando o `Dockerfile` e `railway.toml`.
2. Criar um **volume vazio** e montá-lo em `/data`. Não importar `data/`, `out/`, `.env` ou `src/data/generated` do computador. O `.dockerignore` já os exclui.
3. Gerar um domínio HTTPS Railway, configurar as variáveis abaixo e cadastrar o callback Google.
4. Manter uma réplica e desativar suspensão/serverless: o worker e a limpeza precisam executar mesmo sem abas abertas. Não habilitar deploys paralelos que compartilhem o mesmo SQLite.
5. Implantar; conferir `/healthz`, login e checklist abaixo. Não expor outras portas. O servidor do renderer escuta somente loopback.

O volume é necessário: o filesystem do container não é persistência. Veja [volumes Railway](https://docs.railway.com/volumes) e [configuração por código](https://docs.railway.com/config-as-code/reference).

## Variáveis

| Nome | Uso |
| --- | --- |
| `PUBLIC_URL` | Origem HTTPS exata, por exemplo `https://seu-dashboard.up.railway.app`, sem caminho |
| `GOOGLE_CLIENT_ID` | Cliente OAuth do tipo Web application |
| `GOOGLE_CLIENT_SECRET` | Segredo desse cliente; apenas nas variáveis Railway |
| `ALLOWED_EMAIL` | Um único e-mail Google autorizado e verificado |
| `FOOTBALL_API_KEY` | Chave API-Sports usada ao preparar dados atuais |
| `FOOTBALL_API_HOST` | `v3.football.api-sports.io` |
| `FOOT_ANALYSIS_DATA_DIR` | `/data` (já definido na imagem) |
| `PORT` | Fornecido pelo Railway; HTTP escuta `0.0.0.0` |
| `GOOGLE_TTS_API_KEY` | Opcional; necessária se habilitar narração |
| `GOOGLE_TTS_EN_VOICE`, `GOOGLE_TTS_PT_BR_VOICE` | Vozes opcionais de narração |
| `OPENAI_API_KEY` | Opcional; recursos de geração de texto/histórico que a utilizam |

Não cadastrar credenciais YouTube/TikTok ou tokens de pedidos públicos nesta versão. Não usar `FOOT_ANALYSIS_DB_PATH` apontando para fora do volume. `npm run start:online` ativa o modo online e não carrega `.env`.

## Google OAuth

No Google Cloud, configurar a tela de consentimento e um cliente **Web application**. Usar somente os escopos `openid email`. Se o app estiver em modo de teste, adicionar sua conta como test user. Registrar exatamente `https://SEU-DOMINIO/auth/google/callback` como Authorized redirect URI. Atualizar também `PUBLIC_URL` se o domínio mudar.

O servidor valida assinatura RS256 com as chaves Google, issuer, audience, validade, nonce, e-mail verificado e allowlist. O fluxo usa state de uso único vinculado ao navegador e PKCE. Tokens Google não são persistidos. A sessão opaca é armazenada por hash no SQLite; cookie `HttpOnly; Secure; SameSite=Lax`, sete dias. Logout revoga a sessão. Operações de escrita exigem Origin igual a PUBLIC_URL. Referência: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## Dados e retenção

- `/data/foot-analysis.sqlite`: jobs, snapshots, fila e sessões; schema inicializado automaticamente de modo idempotente.
- `/data/config`: configurações editáveis; seed não sobrescreve arquivos existentes.
- `/data/public`: logos, fontes, trilhas e narrações; assets distribuídos são copiados sem sobrescrever dados existentes.
- `/data/generated`, `/data/history-cache`: dados criados durante o uso.
- `/data/renders`: MP4 final e arquivo parcial do render ativo.

O prazo é **48 horas após a conclusão**, não após o enqueue. O acesso é bloqueado ao vencer; remoção física ocorre na inicialização ou na próxima limpeza horária. A exclusão manual remove somente MP4. Snapshots e assets são preservados para nova renderização. Arquivos parciais são removidos ao encerrar/falhar/cancelar; os abandonados são removidos no reinício. Não apagar `/data/public` para liberar espaço sem revisar referências dos jobs.

## Proteções de segurança

- Limites globais por réplica, em janelas de um minuto: 600 requisições, 10 inícios de login, 30 callbacks e 60 operações de escrita. Respostas 429 incluem `Retry-After`. Como o serviço tem um único usuário, não se confia em `X-Forwarded-For` fornecido pelo cliente. `/healthz` não consome o orçamento. Um ataque ainda pode causar indisponibilidade; esses limites não substituem proteção de rede contra DDoS.
- No máximo 100 estados OAuth pendentes no SQLite, inclusive após reinício. Estados vencidos são removidos na inserção; não se expulsa um login válido para aceitar novos. Sessões e estados também têm limpeza periódica.
- CSP permite scripts locais e o único script inline com nonce por resposta; não permite `unsafe-eval`, plugins, formulários externos ou alteração de base. CSS inline é necessário ao Player. Imagens/mídia HTTPS externas continuam permitidas para assets das composições; `data:` em mídia permite o pequeno áudio interno usado pelo Player no mobile, mas não é permitido em scripts. HSTS, `nosniff`, restrição de frames e Permissions-Policy complementam a autenticação.
- Na imagem oficial, `FOOT_ANALYSIS_CONTAINER=1` exige `/data`. O bootstrap ajusta a propriedade do volume e **descarta root antes de importar/iniciar a aplicação**. Supervisor, servidor e worker rodam como UID/GID 1000. Não alterar o start command para executar diretamente o servidor ou worker. Links simbólicos, hard links de arquivos e outros mounts dentro do volume são rejeitados; arquivos regulares são preservados. `lost+found` do volume não é alterado.
- O código, dependências e browser ficam sob `/app`, sem permissão de escrita para o usuário da aplicação. Novos dados recebem umask 077. O bootstrap root é necessário porque o [Railway monta volumes como root](https://docs.railway.com/volumes#permissions); nenhuma porta é aberta antes da redução de privilégios.
- Conferir `npm audit` regularmente; atualizar todos os pacotes Remotion juntos e validar Player/render antes de deploy. A auditoria npm não cobre pacotes Debian, Chromium nem todas as vulnerabilidades possíveis.
- Usar gerenciador de credenciais/SSH no Git, nunca tokens na URL do remoto. Se houver suspeita de exposição anterior, revogar o token no provedor e emitir outro: remover da URL não o revoga nem limpa cópias anteriores.

Pendências operacionais: habilitar MFA/passkey nas contas Google, GitHub e Railway; configurar backups externos/automáticos e alertas de consumo. Essas mudanças de conta e infraestrutura não são aplicadas pelo código. Não usar dados ou credenciais reais nos testes.

## Backup e restauração

1. Aguardar a fila esvaziar e não preparar/editar durante o backup.
2. Dentro do ambiente com o volume montado: `node scripts/online/backup.mjs /tmp/foot-backup-AAAA-MM-DD`. O destino deve ser novo. O script usa a API de backup SQLite, não copia um banco ativo ignorando o WAL.
3. Baixar/copiar esse diretório para armazenamento privado externo ao serviço. O `/tmp` não é backup persistente. Proteger o backup: ele contém sessões e dados privados. MP4 não é incluído.
4. Para restaurar, parar o serviço e preservar o volume atual como rollback. Restaurar o backup em um volume vazio `/data`, sem arquivos WAL/SHM de outro banco. Reiniciar com as mesmas variáveis.
5. Revogar sessões se necessário, validar integridade SQLite e gerar um vídeo novamente. MP4 ausentes após restauração devem ser gerados novamente.

Também é possível usar backups de volume do Railway; verificar retenção e custos antes de ativá-los. Nunca restaurar por cima de um banco em uso.

## Validação e recursos

### Settings · Meus vídeos e armazenamento

No dashboard online, o link **Settings · Meus vídeos** abre a seção de histórico e armazenamento. Ela mostra data, template, estado, tamanho dos MP4 e espaço total ocupado pelos vídeos concluídos em todas as páginas. É possível baixar/reproduzir novamente enquanto o arquivo estiver disponível, excluir um MP4 ou usar **Excluir todos os MP4**, sempre com confirmação.

A exclusão remove apenas arquivos de vídeos concluídos: preserva snapshots, histórico, músicas e trabalhos ativos/na fila. **Gerar novamente** cria outro render a partir dos dados salvos. A exclusão em lote também inclui arquivos expirados ainda aguardando a limpeza automática, cobre todas as páginas e não inclui renders que concluírem depois do início da operação. O total representa somente MP4, não todo o volume Railway. Não há recuperação do arquivo excluído, mas ele pode ser renderizado novamente.

### Diagnóstico no Railway

Após publicar a versão com logging, o servidor e o worker emitem linhas JSON em stdout/stderr, disponíveis nos logs do deploy do serviço. Não é necessário configurar outra variável nem contratar um serviço de logs.

- Ao falhar uma preparação ou pedido de render, a mensagem do dashboard mostra `Referência: <UUID>`. Buscar esse UUID nos logs: `request_failed` contém a causa sanitizada; `request_finished` contém status e tempo. O mesmo identificador vai no header `X-Request-Id`.
- `render_queued` conecta o `requestId` ao `renderId`. Buscar o `renderId` para acompanhar `render_started`, `render_composition_ready`, `render_completed`, `render_cancelled` ou `render_failed`.
- Falhas do worker incluem etapa (`select_composition`, `render_media`, `save_output`), duração, timeout e interrupção do serviço. `worker_ready` confirma inicialização; `process_failed`/`process_exited` ajudam a identificar quedas dos processos.
- Contexto de preparação inclui somente campos selecionados, como template, liga, temporada, canal e opção de voz. Não são registrados corpos completos de pedidos, narração ou snapshots. Credenciais conhecidas nas variáveis de ambiente, campos sensíveis, query strings de URLs e e-mails são ocultados. Detalhes internos ficam nos logs do servidor, não na resposta ao navegador.
- Para investigar: tentar **Preparar** uma vez, copiar a referência e consultar o evento correspondente. O botão Render também prepara o vídeo antes de enfileirar: uma falha nessa etapa não gera `render_started`.

Logs continuam sendo informação operacional privada; revisar antes de compartilhar. Esta instrumentação identifica a causa, mas não corrige por si só uma falha de preparação/render.

`npm run test:online` cobre sessão/expiração, assinatura/claims Google, allowlist, CSRF, proteção de rotas, snapshots, recuperação da fila e ranges/traversal. `npm run build:online` compila Player + bundle independente dos jobs locais. `node scripts/online/verify.mjs --video` usa fixtures sem APIs para verificar frames dos templates PT/EN, modos animado/estático, e renderizar Nations League.

Em uma imagem local: `docker build -t foot-analysis-online:test .`. Use um volume descartável e credenciais fictícias para testes; não há bypass de autenticação no app. Não usar credenciais fictícias para um deploy real.

Executar `tests/online-container.mjs` com `docker exec --user 1000:1000 CONTAINER node tests/online-container.mjs` no container descartável configurado com `PUBLIC_URL=https://validation.invalid`. O teste confere o UID do supervisor, código não gravável, dois renders, snapshots e proteção de downloads. `npm run test:online` também verifica throttling/429, teto persistente OAuth, nonce/CSP e escape dos campos de HTML.

Antes de dimensionar recursos, medir no Railway um Short comum e Nations League completa: tempo até conclusão, pico de memória do serviço (inclui Chromium/ffmpeg), CPU e tamanho MP4. `docker stats` local é indicativo, não equivale ao hardware Railway. Manter concorrência 1 até medir. Evitar estimativas de custo sem esses dados.

## Checklist de aceitação antes de uso real

- [ ] Login Google real permitido; outra conta rejeitada; logout e sessão expirada bloqueiam dashboard, APIs, assets e downloads.
- [ ] Domínio/callback HTTPS corretos; nenhuma variável secreta aparece no frontend ou nos logs.
- [ ] Preparar PT e EN; preview e MP4 correspondem, inclusive música/paginação Nations League.
- [ ] Dois jobs; editar durante render; cancelar; falhar; reiniciar; tentar novamente sem trocar snapshots.
- [ ] Fechar a aba e voltar; acompanhar estado; reproduzir e baixar em Safari iOS/Chrome Android reais.
- [ ] Recriar container com o mesmo volume; dados e configuração permanecem.
- [ ] MP4 vencido indisponível, removido pela limpeza; novo render usa dados preservados.
- [ ] Backup externo e restauração testados; monitorar espaço do volume.
- [ ] Medir CPU/memória/tempo no ambiente final antes de aumentar limites.

Esta entrega prepara a aplicação. OAuth real, desempenho no Railway e testes em aparelhos físicos dependem do ambiente final; não são substituídos pelos testes com fixtures.

### Evidência local (4 de outubro de 2026)

- Build Docker Node 22/Debian ARM64 passou; inicialização com volume vazio, `options` sem current job e rotas autenticadas responderam 200.
- 80 frames de fixtures (19 templates + Nations League, PT/EN, animado/estático) renderizados sem exceção. Não substitui revisão editorial de todos os dados reais.
- Nations League: 14 grupos, 7 páginas, 1260 frames/42 s, MP4 1080×1920 H.264 + AAC; render no host levou 168,1 s. Esse tempo não é benchmark Railway.
- Dois renders de smoke de 1 s no container concluíram em 5,0 e 5,1 s; snapshots distintos preservados e downloads sem login bloqueados. São testes de integração, não dimensionamento representativo.
- Volume preservou configuração após recriar container. MP4 com expiração simulada foi removido no reinício e snapshot mantido.
- Chromium/Playwright a 390×844: página não vazia, sem exceções JavaScript e sem overflow horizontal; navegação para Static videos passou. Desktop 1440×1000 capturado. APIs externas não foram chamadas com credenciais reais.
- Worker Linux: cancelamento ativo, erro de composição, nova tentativa, interrupção abrupta e retomada do próximo job verificados; backup retornou `integrity_check: ok`.
- Benchmark completo no Docker local ARM64: Nations League 42 s concluída em **177,9 s**; 89 amostras de `docker stats`, pico observado **1011 MiB** e **228,34% CPU** (mais de um núcleo, incluindo Chromium/ffmpeg). Não configurar teto de 1 GiB sem margem; repetir no Railway antes de dimensionar. O pico amostrado não garante o máximo entre amostras.
- `tsc --noEmit` ainda acusa erros preexistentes em `FootballShortTeaser.tsx` e tipos Node do módulo de histórico. O build online passa; não foi declarada uma aprovação global de TypeScript.
