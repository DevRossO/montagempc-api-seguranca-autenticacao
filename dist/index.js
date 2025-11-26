"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usuarios_1 = __importDefault(require("./routes/usuarios"));
const lojas_1 = __importDefault(require("./routes/lojas"));
const pecas_1 = __importDefault(require("./routes/pecas"));
const itensPedido_1 = __importDefault(require("./routes/itensPedido"));
const pedidos_1 = __importDefault(require("./routes/pedidos"));
require("dotenv/config");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/pecas", pecas_1.default);
app.use("/lojas", lojas_1.default);
app.use("/usuarios", usuarios_1.default);
app.use("/itens-pedido", itensPedido_1.default);
app.use("/pedidos", pedidos_1.default);
app.listen(3000, () => {
    console.log("🚀 Servidor rodando na porta 3000");
});
//# sourceMappingURL=index.js.map