// Cada aplicação back-end tem a sua própria instância do PostgreSQL.

import fastify from "fastify";
// Fastify: Um framework web para Node.js que oferece um sistema eficiente de roteamento para declarar e gerenciar rotas em seu aplicativo. Cada rota pode ser configurada para executar operações específicas.
import cookie from "@fastify/cookie";
import { createPoll } from "./routes/create-poll";
import { getPoll } from "./routes/get-polls";
import { voteOnPoll } from "./routes/vote-on-poll";

const APP = fastify(); // Cria uma instância do Fastify.

APP.register(cookie, {
  secret: "polls-app-nlw", // Impede que o usuário modifique o cookie.
  hook: 'onRequest', // Antes de todas as requisições feitas pelo nosso back-end, este plugin entra em ação e faz o parsing dos hooks.
})

// Cadastra a rota dentro do app usando o registrador do Fastify.
APP.register(createPoll)
APP.register(getPoll)
APP.register(voteOnPoll)

APP.listen({ port: 3333 }).then(() => { // Configura o Fastify para ouvir em uma porta específica.
  console.log("O servidor está rodando!");
});
