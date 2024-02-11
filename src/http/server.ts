// Cada aplicação back-end tem a sua própria instância do PostgreSQL.

import fastify from "fastify";
// Fastify: Um framework web para Node.js que oferece um sistema eficiente de roteamento para declarar e gerenciar rotas em seu aplicativo. Cada rota pode ser configurada para executar operações específicas.

import { z } from 'zod'; // Ferramenta para validação de dados.
import { PrismaClient } from "@prisma/client"; // Para inserir a enquete dentro do banco de dados.

const APP = fastify(); // Criada uma instância do Fastify.

const PRISMA = new PrismaClient(); // Conexão com o Prisma estabelecida.

// Para criar a enquete no banco de dados.
APP.post('/polls', async (request, reply) => {
  const CREATE_POLL_BODY = z.object({
    title: z.string()
  }); // O que precisa ter dentro do objeto (enquete).

  const { title } = CREATE_POLL_BODY.parse(request.body);

  // "await" faz com que o "return" seja executado apenas quando a promise é satisfeita.
  const POLL = await PRISMA.poll.create({ // Insere a enquete no banco de dados através do Prisma.
    data: { // Dados que serão inseridos na tabela.
      title
    }
  });
  return reply.status(201).send({ pollID: POLL.id }); // 201: A requisição foi bem-sucedida, e um novo recurso foi criado como resultado.
});

// Métodos HTTP: GET (buscar uma info), POST (criar uma info), PUT (alterar uma info), DELETE (apagar uma info), PATCH (fazer uma alteração de um campo específico dentro de um recurso), HEAD, OPTIONS...

APP.listen({ port: 3333 }).then(() => { // Configura o Fastify para ouvir em uma porta específica
  console.log("O servidor está rodando!");
});