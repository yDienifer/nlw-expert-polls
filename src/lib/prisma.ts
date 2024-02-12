import { PrismaClient } from "@prisma/client"; // Para inserir a enquete dentro do banco de dados.

export const PRISMA = new PrismaClient({
    log: ['query'] // Mostra as queries(referem-se a solicitações ou requisições feitas ao banco de dados para obter, manipular ou inserir dados).
}) // Conexão com o Prisma estabelecida.