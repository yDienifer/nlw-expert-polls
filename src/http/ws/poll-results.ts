import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { VOTING } from "../../utils/voting-pub-sub";

// Criação de uma rota que utiliza WebSocket na aplicação. Isso implica que esta rota, quando acionada pelo front-end, difere de uma requisição HTTP padrão. Em uma requisição HTTP, o cliente faz uma chamada, o servidor processa, retorna a resposta, e a chamada/requisição é encerrada. Já uma requisição WebSocket é contínua; enquanto o front-end não a encerrar manualmente (seja por atualização da página, fechamento do navegador, etc.), ela permanecerá aberta no servidor.

export async function pollResults(APP: FastifyInstance) {
    APP.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {
        const GET_POLL_PARAMS = z.object({
            pollId: z.string().uuid(),
        })

        const { pollId } = GET_POLL_PARAMS.parse(request.params)

        // Inscreve o WebSocket para receber notificações sobre os resultados da enquete especificada.
        VOTING.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message))
        })
    })
}

// Pub/Sub (Publish/Subscribe) é um padrão em que mensagens são publicadas em uma lista, podendo ter formatos específicos. A categorização dessas mensagens em canais é crucial, semelhante a salas de chat, para melhor organização e comunicação.
