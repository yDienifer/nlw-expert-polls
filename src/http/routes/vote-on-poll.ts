import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { PRISMA } from "../../lib/prisma";
import { FastifyInstance } from 'fastify';

export async function voteOnPoll(APP: FastifyInstance) {
    // Rota para obter detalhes de uma enquete específica.
    // O parâmetro pollId é parte da URL para identificar a enquete desejada.
    APP.post('/polls/:pollId/votes', async (request, reply) => {
        const VOTE_ON_POLL_BODY = z.object({
            pollOptionId: z.string().uuid()
        });

        const VOTE_ON_POLL_PARAMS = z.object({
            pollId: z.string().uuid()
        });

        const { pollOptionId } = VOTE_ON_POLL_BODY.parse(request.body);
        const { pollId } = VOTE_ON_POLL_PARAMS.parse(request.params);

        let { sessionId } = request.cookies;

        if (!sessionId) { // Se o usuário nunca fez uma requisição para votar.
            sessionId = randomUUID();

            // Resposta para o usuário.
            // setCookie: recebe duas opções obrigatórias, que são o nome do cookie e o valor desse cookie.
            reply.setCookie('sessionId', sessionId, {
                path: '/', // Indica em quais rotas da aplicação o cookie estará disponível.
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                // Indica por quanto tempo o cookie ficará salvo no computador do usuário (informação obrigatória).
                signed: true, // Faz com que o usuário não consiga modificar o cookie manualmente (afinal, o cookie está assinado).
                // O que significa um cookie assinado?: O back-end garantirá que essa informação foi gerada por este back-end e não foi enviada ou criada manualmente de outra forma.
                httpOnly: true, // Faz com que o cookie só seja acessível pelo back-end da aplicação; ou seja, o front-end não conseguirá acessá-lo.
            });
        }

        const USER_PREVIOUS_VOTE_ON_POLL = await PRISMA.vote.findUnique({
            where: {
                sessionId_pollId: { // Busca por um índice (busca muito mais performática).
                    sessionId,
                    pollId
                }
            }
        });

        if (USER_PREVIOUS_VOTE_ON_POLL) {
            if (USER_PREVIOUS_VOTE_ON_POLL.pollOptionId !== pollOptionId) {
                // Atualizar o voto existente com a nova opção.
                await PRISMA.vote.update({
                    where: {
                        id: USER_PREVIOUS_VOTE_ON_POLL.id
                    },
                    data: {
                        pollOptionId
                    }
                });
            } else {
                return reply.status(400).send({ "message": 'You already voted on this poll with the same option.' });
            }
        } else {
            // Se o usuário não votou antes, criar um novo voto.
            await PRISMA.vote.create({
                data: {
                    sessionId,
                    pollId,
                    pollOptionId
                }
            });
        }

        return reply.status(201).send({ sessionId });
    });
}
