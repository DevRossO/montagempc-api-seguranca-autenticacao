"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const itemPedidoSchema = zod_1.z.object({
    pedidoId: zod_1.z.number().int().positive(),
    pecaId: zod_1.z.number().int().positive(),
    quantidade: zod_1.z.number().int().positive(),
    subtotal: zod_1.z.number().positive()
});
router.post('/', async (req, res) => {
    const valida = itemPedidoSchema.safeParse(req.body);
    if (!valida.success) {
        return res.status(400).json({ erro: valida.error.format() });
    }
    try {
        const item = await prisma.itemPedido.create({
            data: valida.data
        });
        res.status(201).json(item);
    }
    catch (error) {
        res.status(500).json({ erro: 'Erro ao criar item do pedido.' });
    }
});
router.get('/', async (req, res) => {
    try {
        const itens = await prisma.itemPedido.findMany({
            include: { pedido: true, peca: true }
        });
        res.status(200).json(itens);
    }
    catch (error) {
        res.status(500).json({ erro: 'Erro ao listar itens de pedidos.' });
    }
});
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const item = await prisma.itemPedido.findUnique({
            where: { id: Number(id) },
            include: { pedido: true, peca: true }
        });
        if (!item) {
            return res.status(404).json({ erro: 'Item não encontrado.' });
        }
        res.status(200).json(item);
    }
    catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar item do pedido.' });
    }
});
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const valida = itemPedidoSchema.partial().safeParse(req.body);
    if (!valida.success) {
        return res.status(400).json({ erro: valida.error.format() });
    }
    try {
        const item = await prisma.itemPedido.update({
            where: { id: Number(id) },
            data: valida.data
        });
        res.status(200).json(item);
    }
    catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar item do pedido.' });
    }
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.itemPedido.delete({
            where: { id: Number(id) }
        });
        res.status(200).json({ mensagem: 'Item do pedido excluído com sucesso.' });
    }
    catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir item do pedido.' });
    }
});
exports.default = router;
//# sourceMappingURL=itensPedido.js.map