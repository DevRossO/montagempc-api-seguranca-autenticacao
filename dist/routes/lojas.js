"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const lojaSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
    endereco: zod_1.z.string().min(10, { message: "Endereço deve ter no mínimo 10 caracteres" }),
    telefone: zod_1.z.string().min(10, { message: "Telefone deve ter no mínimo 10 caracteres" })
});
router.get('/', async (req, res) => {
    const lojas = await prisma.loja.findMany();
    return res.json(lojas);
});
router.post('/', async (req, res) => {
    try {
        const valida = lojaSchema.safeParse(req.body);
        if (!valida.success) {
            return res.status(400).json({ erro: valida.error });
        }
        const { nome, endereco, telefone } = valida.data;
        const novaLoja = await prisma.loja.create({
            data: { nome, endereco, telefone }
        });
        res.status(201).json(novaLoja);
    }
    catch (error) {
        res.status(500).json({ erro: error });
    }
});
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const valida = lojaSchema.safeParse(req.body);
        if (!valida.success) {
            return res.status(400).json({ erro: valida.error });
        }
        const { nome, endereco, telefone } = valida.data;
        const lojaAtualizada = await prisma.loja.update({
            where: { id: Number(id) },
            data: { nome, endereco, telefone }
        });
        res.status(200).json(lojaAtualizada);
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ erro: 'Loja não encontrada' });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.loja.delete({
            where: { id: Number(id) }
        });
        res.status(200).json({ mensagem: 'Loja removida com sucesso' });
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ erro: 'Loja não encontrada' });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});
exports.default = router;
//# sourceMappingURL=lojas.js.map