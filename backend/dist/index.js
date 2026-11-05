"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const sockets_1 = require("./sockets");
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
const server = http_1.default.createServer(app_1.default);
// Initialize WebSockets
(0, sockets_1.setupWebSockets)(server);
server.listen(PORT, () => {
    console.log(`[Server] Honey Quality Assessment System backend listening on port ${PORT}`);
});
