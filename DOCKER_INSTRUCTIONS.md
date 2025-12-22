# Instruções para Docker (Produção)

Este projeto foi containerizado para um ambiente de produção seguro utilizando Nginx e Docker Multi-stage builds.

## Pré-requisitos

*   Docker
*   Docker Compose (opcional, mas recomendado)
*   Chave de API do Google Gemini (`GEMINI_API_KEY`)

## Construindo a Imagem

A aplicação requer a `GEMINI_API_KEY` no momento da construção (build time) para que o Vite possa embuti-la no código otimizado.

### Opção 1: Usando Docker Compose (Recomendado)

1.  Crie um arquivo `.env` na raiz do projeto (se não existir) ou exporte a variável no seu shell:
    ```bash
    export GEMINI_API_KEY=sua_chave_aqui
    ```

2.  Execute o comando de build e up:
    ```bash
    docker-compose up -d --build
    ```

    O `docker-compose.yml` está configurado para ler a variável de ambiente `GEMINI_API_KEY` do seu sistema ou arquivo `.env` e passá-la como argumento de build.

### Opção 2: Usando Docker CLI diretamente

Se preferir não usar o Compose:

```bash
docker build --build-arg GEMINI_API_KEY=sua_chave_aqui -t cti-sentinel:latest .
docker run -d -p 8080:80 --name cti-sentinel cti-sentinel:latest
```

## Acessando a Aplicação

Após iniciar o container, a aplicação estará disponível em:
[http://localhost:8080](http://localhost:8080)

## Detalhes de Segurança (Hardening)

O servidor Nginx foi configurado com as seguintes medidas de segurança no arquivo `nginx.conf`:

*   **Server Tokens Off:** Oculta a versão do Nginx.
*   **Cabeçalhos de Segurança:**
    *   `X-Frame-Options: SAMEORIGIN`: Previne Clickjacking.
    *   `X-XSS-Protection`: Ativa filtro de XSS do navegador.
    *   `X-Content-Type-Options: nosniff`: Previne MIME sniffing.
    *   `Referrer-Policy`: Controla informações de referência.
    *   `Content-Security-Policy (CSP)`: Restringe fontes de scripts, estilos e conexões para mitigar XSS e injeção de dados.
    *   `Strict-Transport-Security (HSTS)`: Força HTTPS (configurado, mas requer certificado SSL/TLS no balanceador de carga ou proxy reverso se acessado diretamente via HTTPS).
*   **Bloqueio de Arquivos Ocultos:** Nega acesso a arquivos começando com `.` (como `.env`, `.git`).

## Otimização

*   **Multi-stage Build:** A imagem final contém apenas os arquivos estáticos compilados e o servidor Nginx, resultando em um tamanho muito menor (base `nginx:alpine`).
*   **Gzip:** Compressão ativada para arquivos de texto (HTML, CSS, JS).
*   **Cache:** Cabeçalhos de cache configurados para assets estáticos (1 ano).
