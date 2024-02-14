// Define a estrutura da mensagem, que inclui a identificação da opção de votação e a contagem de votos.
type Message = { pollOptionId: string, votes: number }

// Define um tipo para funções que recebem uma mensagem como parâmetro.
type Subscriber = (message: Message) => void

class VotingPubSub {
    // Armazena os canais de comunicação entre diferentes partes do código, iniciando como um objeto vazio.
    private channels: Record<string, Subscriber[]> = {}

    // Permite a inscrição em um canal de comunicação (pollId) para receber notificações.
    subscribe(pollId: string, subscriber: Subscriber) {
        // Se o canal ainda não existe, cria um array vazio para ele.
        if (!this.channels[pollId]) {
            this.channels[pollId] = []
        }
        // Adiciona o subscriber ao canal.
        this.channels[pollId].push(subscriber)
    }

    // Publica uma mensagem em um canal específico.
    publish(pollId: string, message: Message) {
        // Se não houver nenhum subscriber no canal, retorna sem fazer nada.
        if (!this.channels[pollId]) {
            return
        }

        // Chama a função do subscriber passando a mensagem como argumento quando há um novo inscrito no canal.
        for (const SUBSCRIBER of this.channels[pollId]) {
            SUBSCRIBER(message)
        }
    }
}

// Exporta uma instância da classe VotingPubSub para ser utilizada como um singleton (um único ponto de comunicação).
export const VOTING = new VotingPubSub()
