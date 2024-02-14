import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { PRISMA } from "../../lib/prisma";
import { FastifyInstance } from 'fastify';
import { REDIS } from '../../lib/redis';
import { VOTING } from '../../utils/voting-pub-sub';

export async function voteOnPoll(APP: FastifyInstance) {
    // Rota para obter detalhes de uma enquete específica.
    // O parâmetro pollId faz parte da URL para identificar a enquete desejada.
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

        // Se o usuário nunca fez uma requisição para votar, gera um novo sessionId.
        if (!sessionId) {
            sessionId = randomUUID();

            // Resposta para o usuário.
            // setCookie: recebe duas opções obrigatórias, que são o nome do cookie e o valor desse cookie.
            reply.setCookie('sessionId', sessionId, {
                path: '/', // Indica em quais rotas da aplicação o cookie estará disponível.
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                signed: true, // O back-end garante que essa informação foi gerada por ele e não foi manipulada manualmente.
                httpOnly: true, // O cookie só é acessível pelo back-end da aplicação, não pelo front-end.
            });
        }

        const USER_PREVIOUS_VOTE_ON_POLL = await PRISMA.vote.findUnique({
            where: {
                sessionId_pollId: { // Busca por um índice, mais performático.
                    sessionId,
                    pollId
                }
            }
        });

        if (USER_PREVIOUS_VOTE_ON_POLL) {
            if (USER_PREVIOUS_VOTE_ON_POLL.pollOptionId !== pollOptionId) {
                // Atualiza o voto existente com a nova opção.
                await PRISMA.vote.update({
                    where: {
                        id: USER_PREVIOUS_VOTE_ON_POLL.id
                    },
                    data: {
                        pollOptionId
                    }
                });

                // Atualiza os votos no Redis e notifica os inscritos sobre a mudança.
                const VOTES = await REDIS.zincrby(pollId, -1, USER_PREVIOUS_VOTE_ON_POLL.pollOptionId)
                VOTING.publish(pollId, {
                    pollOptionId: USER_PREVIOUS_VOTE_ON_POLL.pollId,
                    votes: Number(VOTES)
                });
            } else {
                return reply.status(400).send({ "message": 'You have already voted on this poll with the same option.' });
            }
        } else {
            // Se o usuário não votou antes, cria um novo voto.
            await PRISMA.vote.create({
                data: {
                    sessionId,
                    pollId,
                    pollOptionId
                }
            });
        }

        // Incrementa em 1 o ranking dessa opção de voto no Redis e notifica os inscritos sobre a mudança.
        const VOTES = await REDIS.zincrby(pollId, 1, pollOptionId)
        VOTING.publish(pollId, {
            pollOptionId,
            votes: Number(VOTES)
        });

        // Responde com sucesso, retornando o sessionId.
        return reply.status(201).send({ sessionId });
    });
}
