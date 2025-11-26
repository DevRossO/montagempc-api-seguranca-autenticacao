import express from "express"
import usuariosRouter from "./routes/usuarios"
import lojasRouter from "./routes/lojas";
import pecasRouter from "./routes/pecas";
import itensPedidoRouter from "./routes/itensPedido";
import pedidosRouter from "./routes/pedidos";
import 'dotenv/config'


const app = express()
app.use(express.json())

app.use("/pecas", pecasRouter)
app.use("/lojas", lojasRouter)
app.use("/usuarios", usuariosRouter)
app.use("/itens-pedido", itensPedidoRouter);
app.use("/pedidos", pedidosRouter);

app.listen(3000, () => {
  console.log("🚀 Servidor rodando na porta 3000")
})
