import { z } from 'zod';
import { PRISMA } from "../../lib/prisma";
import { FastifyInstance } from 'fastify';
import { REDIS } from '../../lib/redis';

export async function getPoll(APP: FastifyInstance) {
    // Rota para obter detalhes de uma enquete específica.
    // O parâmetro pollId faz parte da URL e serve para identificar a enquete desejada.
    APP.get('/polls/:pollId', async (request, reply) => {
        // Define a estrutura esperada para os parâmetros da requisição.
        const GET_POLL_PARAMS = z.object({
            pollId: z.string().uuid(), // Deve ser obrigatoriamente um UUID.
        });

        // Extrai o pollId dos parâmetros da requisição.
        const { pollId } = GET_POLL_PARAMS.parse(request.params);

        // Obtém os detalhes da enquete, incluindo dados relacionados às opções.
        const POLL = await PRISMA.poll.findUnique({
            where: {
                id: pollId,
            },
            include: { // Inclui dados de relacionamentos enquanto traz dados de uma entidade específica.
                options: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        });

        // Retorna uma resposta de erro caso a enquete não seja encontrada.
        if (!POLL) {
            return reply.status(400).send({ message: "Poll not found." })
        }

        // Obtém as três opções mais votadas da enquete.
        const RESULT = await REDIS.zrange(pollId, 0, -1, 'WITHSCORES')

        // Converte o array de resultados em um objeto de votos.
        const VOTES = RESULT.reduce((object, line, index) => {
            if (index % 2 === 0) { // Se o índice for par.
                const SCORE = RESULT[index + 1]

                // Mescla os objetos de votos.
                Object.assign(object, { [line]: Number(SCORE) })
            }

            return object
        }, {} as Record<string, number>)

        // Retorna os detalhes da enquete, incluindo as opções e a contagem de votos.
        return reply.send({
            POLL: {
                id: POLL.id,
                title: POLL.title,
                options: POLL.options.map((option => {
                    return {
                        id: option.id,
                        title: option.title,
                        score: (option.id in VOTES) ? VOTES[option.id] : 0
                    }
                }))
            }
        });
    });
}
