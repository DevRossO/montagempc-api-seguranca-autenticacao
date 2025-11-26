import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const router = Router();

const usuarioSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  saldo: z.number().nonnegative()
});

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "9fa75ade239c68", 
    pass: "bf8ec3cb469eff", 
  },
});

router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.post("/", async (req, res) => {
  const valida = usuarioSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error });
  }

  try {
    const usuario = await prisma.usuario.create({
      data: valida.data
    });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await prisma.usuario.delete({
      where: { id: Number(id) }
    });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const valida = usuarioSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error });
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: valida.data
    });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

function gerarRelatorioPedidosHTML(usuario: any) {
  if (usuario.pedidos.length === 0) {
    return `<p>❌ Nenhum pedido encontrado.</p>`;
  }

  return usuario.pedidos
    .map(
      (pedido: any) => `
      <div style="margin-bottom: 20px;">
        <h3>🧾 Pedido #${pedido.id}</h3>
        <p><strong>Data:</strong> ${new Date(pedido.data).toLocaleString()}</p>
        <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
        <ul>
          ${pedido.itens
            .map(
              (item: any) =>
                `<li>${item.peca.nome} | Qtd: ${item.quantidade} | R$ ${item.peca.preco}</li>`
            )
            .join("")}
        </ul>
        <hr/>
      </div>
    `
    )
    .join("");
}

router.get("/email/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: Number(id) },
      include: {
        pedidos: {
          include: {
            itens: {
              include: {
                peca: true
              }
            }
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>📧 Relatório de Pedidos do Usuário</h2>
        <p><strong>Nome:</strong> ${usuario.nome}</p>
        <p><strong>Email:</strong> ${usuario.email}</p>
        <p><strong>Saldo atual:</strong> R$ ${usuario.saldo.toFixed(2)}</p>
        <hr/>
        ${gerarRelatorioPedidosHTML(usuario)}
      </div>
    `;

    await transporter.sendMail({
      from: '"Loja Tech" <no-reply@lojatech.com>',
      to: usuario.email,
      subject: "📦 Relatório de Pedidos",
      html,
    });

    res.status(200).json({
      mensagem: `E-mail enviado com sucesso para ${usuario.email}`,
      usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao enviar o e-mail" });
  }
});

export default router;