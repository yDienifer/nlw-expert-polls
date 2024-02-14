// As rotas do Fastify precisam ser exportadas como uma função (obrigatoriamente assíncrona para evitar que o Fastify fique carregando infinitamente).

import { z } from 'zod'; // Ferramenta para validação de dados.
import { PRISMA } from "../../lib/prisma";
import { FastifyInstance } from 'fastify';

export async function createPoll(APP: FastifyInstance) {
    // Para criar a enquete no banco de dados.
    APP.post('/polls', async (request, reply) => {
        const CREATE_POLL_BODY = z.object({
            title: z.string(),
            options: z.array(z.string())
        }); // Define a estrutura esperada do objeto (enquete).

        const { title, options } = CREATE_POLL_BODY.parse(request.body);

        // A palavra-chave "await" faz com que o "return" seja executado apenas quando a promise é satisfeita.
        const POLL = await PRISMA.poll.create({ // Insere a enquete no banco de dados através do Prisma.
            data: { // Dados que serão inseridos na tabela.
                title,
                options: {
                    // createMany: uma forma de criar várias opções para aquela enquete ao mesmo tempo que a cria.
                    createMany: {
                        data: options.map(option => { // Isso cria um conjunto de objetos onde cada objeto representa uma opção de enquete com seu título e a referência à enquete a que pertence (pollId).
                            return { title: option }
                        }),
                    }
                },
            }
        });

        return reply.status(201).send({ pollId: POLL.id }); // Código 201: A requisição foi bem-sucedida, e um novo recurso foi criado como resultado.
    });

    // Métodos HTTP: GET (buscar uma informação), POST (criar uma informação), PUT (alterar uma informação), DELETE (apagar uma informação), PATCH (fazer uma alteração em um campo específico dentro de um recurso), HEAD, OPTIONS...
}
