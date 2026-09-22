# Prediction Shorts service

Serviço isolado para receber palpites do site público, salvar a fila e renderizar
`FootballPredictionsShort`. Ele reutiliza o pipeline Remotion existente, mas não
inicia nem expõe o dashboard atual.

## Execução local

Configure as variáveis de `.env.example` e execute:

```bash
npm run prediction-service
```

Healthcheck:

```bash
curl http://127.0.0.1:4322/health
```

## Railway

Crie um serviço separado apontando para este mesmo repositório. Use o comando:

```bash
npm run prediction-service
```

O serviço precisa de um Volume Railway para os diretórios `data/` e `out/`.
Configure `PREDICTION_PUBLIC_URL` com a URL pública do serviço e mantenha os
tokens fora do frontend. O site deve chamar os endpoints por Route Handlers
server-side, usando `Authorization: Bearer`.

O endpoint `/admin` é uma fila operacional mínima para testar o fluxo. Em
produção, restrinja-o por rede, proxy ou token administrativo forte.
