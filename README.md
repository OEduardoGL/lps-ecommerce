# LPS de E-commerce

Implementação de uma **Linha de Produto de Software (LPS)** para e-commerce web.

## Conceitos Aplicados
- **Linha de Produto de Software (LPS)** – a configuração de features (`catalog`, `users`, `orders`, `recommendation`) define variantes `minimal`, `standard` e `premium` em `config/product-line.json`.
- **Componentização** – catálogos, perfis de usuários, pedidos e motor de recomendação moram em `shared/` e são reutilizados por múltiplos serviços.
- **Microserviços** – cada feature é exposta por um serviço Express independente, iniciado isoladamente ou pelo orquestrador.
- **Persistência** – dados são armazenados em PostgreSQL (`db/init.sql` cria o esquema e popula dados base).
- **Recomendação híbrida** – combina similaridade de categorias/tags, preferências do usuário e contagem de co-compra obtida a partir dos pedidos registrados.

## Estrutura Geral
```
.
├── config/product-line.json   # Definição das features e variantes
├── db/init.sql                # Script SQL para criar tabelas e dados iniciais
├── docker-compose.yml         # Define Postgres + microserviços containerizados
├── services/                  # APIs Express (catalog, users, orders, recommendation)
├── shared/                    # Componentes reutilizados e conexão com o banco
├── scripts/                   # Orquestrador da LPS e utilitários de seed
├── front/                     # SPA em React (catálogo, clientes, pedidos)
├── Dockerfile 
└── README.md
```

## Variantes da LPS
| Variante  | Descrição                                                        | Serviços (portas)                                |
|-----------|------------------------------------------------------------------|--------------------------------------------------|
| `minimal` | Apenas vitrine de produtos                                       | `catalog` (4101)                                 |
| `standard`| Cadastro de clientes + pedidos (sem recomendações)               | `catalog` (4101), `users` (4102), `orders` (4103) |
| `premium` | Todos os recursos incluindo recomendações de produtos            | `catalog` (4101), `users` (4102), `orders` (4103), `recommendation` (4104) |

## Persistência em PostgreSQL
### Esquema
- `products`: catálogo com preço, estoque, categorias e tags (`TEXT[]`).
- `users`: clientes com preferências (`TEXT[]`).
- `orders` e `order_items`: pedidos com itens, status e histórico.

`npm run db:seed` para recomeçar com o estado base em um banco local.

## Configuração de Ambiente
1. Instale dependências na raiz (`npm install`) e no front (`cd front && npm install`).
2. Defina a variante padrão copiando o exemplo de variáveis:
   ```bash
   cp .env.example .env
   ```
   Ajuste `LPS_VARIANT` para `minimal`, `standard` ou `premium`. Esse valor é usado pelos scripts `npm run start:variant` e `npm run dev:full`.  
   > Se o arquivo `.env` não estiver presente, adotamos `standard` automaticamente.
3. Para o front, existem variáveis opcionais em `front/.env.example` (URLs das APIs).

## Como Executar o Sistema

### Backend local (Node + PostgreSQL)
1. Suba o PostgreSQL:
   ```bash
   docker compose up -d db
   ```
2. Instale dependências do monorepo:
   ```bash
   npm install
   ```
3. (Opcional) Popule o banco:
   ```bash
   npm run db:seed
   ```
4. Inicie a variante desejada:
   ```bash
   npm run start:minimal      # catálogo
   npm run start:standard     # catálogo + usuários + pedidos
   npm run start:premium      # + recomendações
   # ou respeitando o .env:
   npm run start:variant      # usa LPS_VARIANT definido no .env
   ```
   O orquestrador em `scripts/start-variant.js` lê `config/product-line.json` e ativa apenas os serviços selecionados.

### Backend com Docker Compose
```bash
docker compose up --build
```
Portas expostas:
- Catalog: http://localhost:4101
- Users: http://localhost:4102
- Orders: http://localhost:4103
- Recommendation (premium): http://localhost:4104

Finalize com:
```bash
docker compose down        # encerra serviços
docker compose down -v     # encerra e remove volume do banco
```

Para (re)popular o banco enquanto os containers estiverem rodando:
```bash
docker compose run --rm catalog node scripts/seed.js
```

### Front-end (SPA)
1. Certifique-se de que os microserviços estão no ar (por script ou docker).
2. Em outro terminal:
   ```bash
   cd front
   npm install        # primeira vez
   npm run dev
   ```
3. Acesse http://localhost:8080.

No modo dev o Vite cria proxies `/api/catalog|users|orders|recommendations -> http://localhost:4101-4104`. Se precisar apontar para hosts diferentes, copie `front/.env.example` para `front/.env` e informe `VITE_API_*`.

### Rodando tudo com um único comando
Para subir backend (respeitando `LPS_VARIANT` do `.env`) **e** o front ao mesmo tempo:
```bash
npm run dev:full
```
Esse comando mantém os dois processos em paralelo, com logs identificados como `backend` e `frontend`.

> Observação: se estiver utilizando `docker compose up`, não execute `npm run start:*` ou `npm run dev:full` ao mesmo tempo, pois as portas 4101–4104 já estarão ocupadas pelos serviços containerizados.

## APIs Disponíveis
### Catálogo (`:4101`)
- `GET /health`
- `GET /products?q=&category=&tag=`
- `GET /products/:id`

### Usuários (`:4102`)
- `GET /health`
- `GET /users`
- `GET /users/:id`
- `POST /users`
  ```json
  {
    "name": "Nome",
    "email": "email@example.com",
    "favoriteCategories": ["eletronicos"]
  }
  ```

### Pedidos (`:4103`)
- `GET /health`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
  ```json
  {
    "userId": "u-1",
    "items": [
      { "productId": "p-100", "quantity": 1 }
    ]
  }
  ```
- `PATCH /orders/:id/status`
  ```json
  { "status": "sent" }
  ```

### Recomendações (`:4104`)
- `GET /health`
- `GET /recommendations?userId=&productId=&limit=`
- `GET /recommendations/related/:productId`

## Testes Manuais 
1. **Variante minimal**
   ```bash
   npm run start:minimal
   curl http://localhost:4101/products
   ```
   
## Testes

### 1. Variante `minimal`
```bash
npm run start:minimal
# Em outro terminal
curl http://localhost:4101/health
curl "http://localhost:4101/products?q=notebook"
```

### 2. Variante `standard`
```bash
npm run start:standard
curl http://localhost:4102/users
curl -X POST http://localhost:4103/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"u-1","items":[{"productId":"p-100","quantity":1}]}'
curl http://localhost:4103/orders
```
> pedido criado com preço e status `created`. Estoque do produto reduzido.

### Front-end (SPA)

Fluxos principais disponíveis na SPA:
- Catálogo: busca, filtros por categoria/tag, detalhe do produto, carrinho.
- Clientes: listagem e cadastro (POST `/users`).
- Pedidos: criação a partir do carrinho, listagem com atualização de status.
- Recomendações (premium): lista produtos relacionados em `/products/:id` e painel opcional no módulo de pedidos.

### 3. Variante `premium`
```bash
npm run start:premium
curl "http://localhost:4104/recommendations?productId=p-100"
curl -X POST http://localhost:4103/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"u-3","items":[{"productId":"p-102","quantity":1},{"productId":"p-104","quantity":1}]}'
curl "http://localhost:4104/recommendations?userId=u-3"
```
> recomendações priorizam categorias/tag relacionadas e evoluem após registrar o pedido (co-compra aumenta o score dos itens envolvidos).
