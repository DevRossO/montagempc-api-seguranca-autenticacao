import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { authMiddleware } from "../middlewares/authMiddleware";
import { registrarLog } from "../utils/logs";

const prisma = new PrismaClient();
const router = Router();

const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const mensagemSenha = "A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e símbolo.";


const usuarioSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().regex(senhaRegex, mensagemSenha),
  saldo: z.number().nonnegative().optional().default(0),
});

const usuarioUpdateSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  senha: z.string().regex(senhaRegex, mensagemSenha).optional(),
  saldo: z.number().nonnegative().optional(),
});

const alterarSenhaSchema = z.object({
  senhaAtual: z.string(),
  novaSenha: z.string().regex(senhaRegex, mensagemSenha),
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
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, saldo: true, ultimoLogin: true },
    });
    res.status(200).json(usuarios);
  } catch {
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
});

router.post("/", async (req, res) => {
  const valida = usuarioSchema.safeParse(req.body);
  if (!valida.success) return res.status(400).json({ erro: valida.error.format() });

  try {
    const { nome, email, senha, saldo } = valida.data;
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaCriptografada, saldo },
      select: { id: true, nome: true, email: true, saldo: true, senha: true, ultimoLogin: true },
    });

    await registrarLog(usuario.id, "Cadastro de usuário");

    res.status(201).json(usuario);
  } catch (error: any) {
    if (error.code === "P2002") return res.status(400).json({ erro: "Email já cadastrado" });
    res.status(500).json({ erro: "Erro ao criar usuário" });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  const usuarioId = req.user!.id;
  const valida = usuarioUpdateSchema.safeParse(req.body);
  if (!valida.success) return res.status(400).json({ erro: valida.error.format() });

  try {
    const dataToUpdate: any = { ...valida.data };
    if (dataToUpdate.senha) dataToUpdate.senha = await bcrypt.hash(dataToUpdate.senha, 10);

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: dataToUpdate,
      select: { id: true, nome: true, email: true, saldo: true, ultimoLogin: true },
    });

    await registrarLog(usuario.id, "Atualização de usuário");
    res.status(200).json(usuario);
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ erro: "Usuário não encontrado" });
    res.status(500).json({ erro: "Erro ao atualizar usuário" });
  }
});

router.delete("/", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user!.id;
    await prisma.usuario.delete({ where: { id: usuarioId } });
    await registrarLog(usuarioId, "Usuário removido");
    res.json({ mensagem: "Usuário removido com sucesso" });
  } catch {
    res.status(400).json({ erro: "Erro ao excluir usuário" });
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.senha) {
    if (usuario) await registrarLog(usuario.id, "Tentativa de login inválida");
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }

  if (usuario.bloqueado) {
    return res.status(403).json({ erro: "Usuário bloqueado por tentativas inválidas" });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    let tentativas = usuario.tentativasLogin + 1;
    let bloqueado = tentativas >= 3;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasLogin: tentativas, bloqueado },
    });

    await registrarLog(usuario.id, "Tentativa de login inválida");

    const msg = bloqueado
      ? "Usuário bloqueado após 3 tentativas inválidas"
      : "Email ou senha inválidos";

    return res.status(401).json({ erro: msg });
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { tentativasLogin: 0, bloqueado: false, ultimoLogin: new Date() },
  });

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  await registrarLog(usuario.id, "Login bem-sucedido");

  res.json({
    mensagem: `Bem-vindo ${usuario.nome}`,
    token,
    ultimoLogin: usuario.ultimoLogin,
  });
});

router.put("/alterar-senha", authMiddleware, async (req, res) => {
  const valida = alterarSenhaSchema.safeParse(req.body);
  if (!valida.success) return res.status(400).json({ erro: valida.error.format() });

  try {
    const { senhaAtual, novaSenha } = valida.data;
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id }
    });

    if (!usuario || !usuario.senha) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      await registrarLog(usuario.id, "Tentativa de alteração de senha inválida");
      return res.status(401).json({ erro: "Senha atual incorreta" });
    }

    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10);

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: novaSenhaCriptografada },
      select: {
        id: true,
        email: true,
        senha: true
      }
    });

    await registrarLog(usuario.id, "Senha alterada com sucesso");

    res.json({
      mensagem: "Senha alterada com sucesso",
      usuario: usuarioAtualizado
    });

  } catch {
    res.status(500).json({ erro: "Erro ao alterar senha" });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  return res.json({ message: "Usuário autenticado", user: req.user });
});

router.get("/logs", authMiddleware, async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      include: { usuario: { select: { id: true, nome: true, email: true } } },
      orderBy: { timestamp: "desc" },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ erro: "Erro ao listar logs" });
  }
});

router.get("/backup", authMiddleware, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    const logs = await prisma.log.findMany();
    const backupData = { usuarios, logs };

    const filePath = path.join(__dirname, "../backup.json");
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    res.json({ mensagem: "Backup realizado com sucesso", filePath });
  } catch {
    res.status(500).json({ erro: "Erro ao realizar backup" });
  }
});

router.post("/restore", authMiddleware, async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../backup.json");
    const backupRaw = fs.readFileSync(filePath, "utf-8");
    const backupData = JSON.parse(backupRaw);

    await prisma.log.deleteMany();
    await prisma.usuario.deleteMany();

    for (const u of backupData.usuarios) {
      await prisma.usuario.create({
        data: {
          id: u.id,
          nome: u.nome,
          email: u.email,
          senha: u.senha,
          saldo: u.saldo,
          ultimoLogin: u.ultimoLogin ? new Date(u.ultimoLogin) : null,
        },
      });
    }

    for (const l of backupData.logs) {
      await prisma.log.create({
        data: { id: l.id, acao: l.acao, timestamp: new Date(l.timestamp), usuarioId: l.usuarioId },
      });
    }

    res.json({ mensagem: "Restore realizado com sucesso" });
  } catch {
    res.status(500).json({ erro: "Erro ao restaurar backup" });
  }
});

export default router;