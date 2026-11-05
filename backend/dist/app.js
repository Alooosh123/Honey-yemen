"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const scan_routes_1 = __importDefault(require("./routes/scan.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const shops_routes_1 = __importDefault(require("./routes/shops.routes"));
const marketplace_routes_1 = __importDefault(require("./routes/marketplace.routes"));
const saas_routes_1 = __importDefault(require("./routes/saas.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static PDF reports & public assets
app.use(express_1.default.static(path_1.default.join(process.cwd(), 'public')));
app.use('/reports', express_1.default.static(path_1.default.join(process.cwd(), 'public', 'reports')));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/scan', scan_routes_1.default);
app.use('/api/shops', shops_routes_1.default);
app.use('/api/marketplace', marketplace_routes_1.default);
app.use('/api/saas', saas_routes_1.default);
// System Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        system: 'Honey Quality Assessment System v3.0 (Web-Based)',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
