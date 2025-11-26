import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const pedidoSchema = z.object({
  usuarioId: z.number().int().positive(),
  itens: z.array(
    z.object({
      pecaId: z.number().int().positive(),
      quantidade: z.number().int().positive()
    })
  ).min(1, { message: "O pedido deve conter pelo menos um item." })
});

router.post('/', async (req, res) => {
  const valida = pedidoSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.format() });
  }

  const { usuarioId, itens } = valida.data;

  try {
    const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const usuario = await tx.usuario.findUnique({ where: { id: usuarioId } });
      if (!usuario) {
        throw new Error("Usuário não encontrado.");
      }

      let totalPedido = 0;

      for (const item of itens) {
        const peca = await tx.peca.findUnique({ where: { id: item.pecaId } });
        if (!peca) {
          throw new Error(`Peça com ID ${item.pecaId} não encontrada.`);
        }
        if (peca.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para a peça: ${peca.nome}`);
        }

        totalPedido += peca.preco * item.quantidade;
      }

      if (usuario.saldo < totalPedido) {
        throw new Error("Saldo insuficiente para realizar o pedido.");
      }

      const pedido = await tx.pedido.create({
        data: {
          usuarioId,
          total: totalPedido,
          itens: {
            create: await Promise.all(
              itens.map(async (item) => {
                const peca = await tx.peca.findUnique({ where: { id: item.pecaId } });
                if (!peca) throw new Error(`Peça ID ${item.pecaId} não encontrada.`);

                await tx.peca.update({
                  where: { id: item.pecaId },
                  data: { quantidade: peca.quantidade - item.quantidade }
                });

                return {
                  pecaId: item.pecaId,
                  quantidade: item.quantidade,
                  subtotal: peca.preco * item.quantidade
                };
              })
            )
          }
        },
        include: { itens: true }
      });

      await tx.usuario.update({
        where: { id: usuarioId },
        data: { saldo: usuario.saldo - totalPedido }
      });

      return pedido;
    });

    res.status(201).json({
      mensagem: "Pedido realizado com sucesso!",
      pedido: resultado
    });
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        usuario: true,
        itens: { include: { peca: true } }
      }
    });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar pedidos." });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(id) },
      include: { itens: true }
    });
    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of pedido.itens) {
        const peca = await tx.peca.findUnique({ where: { id: item.pecaId } });
        if (peca) {
          await tx.peca.update({
            where: { id: item.pecaId },
            data: { quantidade: peca.quantidade + item.quantidade }
          });
        }
      }

      const usuario = await tx.usuario.findUnique({ where: { id: pedido.usuarioId } });
      if (usuario) {
        await tx.usuario.update({
          where: { id: usuario.id },
          data: { saldo: usuario.saldo + pedido.total }
        });
      }

      await tx.itemPedido.deleteMany({ where: { pedidoId: pedido.id } });
      await tx.pedido.delete({ where: { id: pedido.id } });
    });

    res.status(200).json({ mensagem: "Pedido excluído e transações revertidas com sucesso." });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir o pedido." });
  }
});

export default router;
