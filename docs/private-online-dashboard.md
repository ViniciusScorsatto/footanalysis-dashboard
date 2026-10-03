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

## Backup e restauração

1. Aguardar a fila esvaziar e não preparar/editar durante o backup.
2. Dentro do ambiente com o volume montado: `node scripts/online/backup.mjs /tmp/foot-backup-AAAA-MM-DD`. O destino deve ser novo. O script usa a API de backup SQLite, não copia um banco ativo ignorando o WAL.
3. Baixar/copiar esse diretório para armazenamento privado externo ao serviço. O `/tmp` não é backup persistente. Proteger o backup: ele contém sessões e dados privados. MP4 não é incluído.
4. Para restaurar, parar o serviço e preservar o volume atual como rollback. Restaurar o backup em um volume vazio `/data`, sem arquivos WAL/SHM de outro banco. Reiniciar com as mesmas variáveis.
5. Revogar sessões se necessário, validar integridade SQLite e gerar um vídeo novamente. MP4 ausentes após restauração devem ser gerados novamente.

Também é possível usar backups de volume do Railway; verificar retenção e custos antes de ativá-los. Nunca restaurar por cima de um banco em uso.

## Validação e recursos

`npm run test:online` cobre sessão/expiração, assinatura/claims Google, allowlist, CSRF, proteção de rotas, snapshots, recuperação da fila e ranges/traversal. `npm run build:online` compila Player + bundle independente dos jobs locais. `node scripts/online/verify.mjs --video` usa fixtures sem APIs para verificar frames dos templates PT/EN, modos animado/estático, e renderizar Nations League.

Em uma imagem local: `docker build -t foot-analysis-online:test .`. Use um volume descartável e credenciais fictícias para testes; não há bypass de autenticação no app. Não usar credenciais fictícias para um deploy real.

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
