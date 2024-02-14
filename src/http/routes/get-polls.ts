import { z } from 'zod';
import { PRISMA } from "../../lib/prisma";
import { FastifyInstance } from 'fastify';

export async function getPoll(APP: FastifyInstance) {
    // Rota para obter detalhes de uma enquete específica.
    // O parâmetro pollId é parte da URL e serve para identificar a enquete desejada.
    APP.get('/polls/:pollId', async (request, reply) => {
        const GET_POLL_PARAMS = z.object({
            pollId: z.string().uuid(), // Deve ser obrigatoriamente um UUID.
        });

        const { pollId } = GET_POLL_PARAMS.parse(request.params);

        const POLL = await PRISMA.poll.findUnique({
            where: {
                id: pollId,
            },
            include: { // Incluir dados de relacionamentos enquanto traz dados de uma entidade específica.
                options: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        });

        return reply.send({ POLL });
    });
}
