import { PrismaClient, Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

const prisma = new PrismaClient();

const router = Router();

const pecaSchema = z.object({
    nome: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
    tipo: z.string().min(2, { message: "Tipo deve ter no mínimo 2 caracteres" }),
    quantidade: z.number().min(0, { message: "Quantidade deve ser um número positivo" }),
    preco: z.number().min(0, { message: "Preço deve ser um número positivo" }),
    lojaId: z.number().min(1, { message: "Loja ID deve ser um número positivo" })
});

router.get('/', async (req, res) => {
    const pecas = await prisma.peca.findMany();
    return res.json(pecas);
});

router.post('/', async (req, res) => {
    try {
        const valida = pecaSchema.safeParse(req.body);
        if (!valida.success) {
            return res.status(400).json({ erro: valida.error });
        }
        const { nome, tipo, quantidade, preco, lojaId } = valida.data;

        const novaPeca = await prisma.peca.create({
            data: { nome, tipo, quantidade, preco, lojaId }
        });
        res.status(201).json(novaPeca);
    } catch (error) {
        res.status(500).json({ erro: error });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const valida = pecaSchema.safeParse(req.body);
        if (!valida.success) {
            return res.status(400).json({ erro: valida.error });
        }

        const { nome, tipo, quantidade, preco, lojaId } = valida.data;

        const pecaAtualizada = await prisma.peca.update({
            where: { id: Number(id) },
            data: { nome, tipo, quantidade, preco, lojaId }
        });

        res.status(200).json(pecaAtualizada);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ erro: 'Peça não encontrada' });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}); 

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.peca.delete({
            where: { id: Number(id) }
        });
        res.status(200).json({ mensagem: 'Peça removida com sucesso' });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ erro: 'Peça não encontrada para exclusão' });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

export default router;
