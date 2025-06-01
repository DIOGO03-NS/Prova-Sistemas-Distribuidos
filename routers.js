const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const passageiroController = require('./controller/passageiroController');
const vooController = require('./controller/vooController');
const portaoController = require('./controller/portaoController');
const relatoriosController = require('./controller/relatoriosController');

// Importar controllers e middlewares de autenticação
const authController = require('./controller/authController');
const { protect, authorize } = require('./middleware/authMiddleware');

router.get('/ping', (req, res) => {
    res.json({ retorno: true });
});

// --- ROTAS DE AUTENTICAÇÃO ---
router.post('/auth/signup', [
    check('nome').notEmpty().withMessage('Nome é obrigatório'),
    check('email').isEmail().withMessage('Forneça um email válido').normalizeEmail(),
    check('senha').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres'),
    check('cargo').optional().isIn(['admin', 'funcionario']).withMessage('Cargo inválido. Permitido: admin, funcionario')
], authController.signup);

router.post('/auth/login', [
    check('email').isEmail().withMessage('Forneça um email válido').normalizeEmail(),
    check('senha').notEmpty().withMessage('Senha é obrigatória')
], authController.login);


// --- ROTAS DE PASSAGEIRO ---
// POST /passageiros: AGORA REQUER AUTENTICAÇÃO E CARGO 'admin'
router.post('/passageiros', protect, authorize('admin'), [ // Adicionado authorize('admin')
    check('nome').notEmpty().withMessage('Nome é obrigatório'),
    check('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF inválido'),
    check('vooId').isMongoId().withMessage('ID do voo inválido')
], passageiroController.createUser);

// Demais rotas de passageiro:
// GETs podem ser públicos ou exigir autenticação básica. Decidir conforme necessidade.
// Aqui, vamos proteger as rotas de alteração para admins.
router.get('/passageiros', passageiroController.getAllUsers);
router.get('/passageiros/:id', passageiroController.getUser);
// PUT, DELETE, PATCH /passageiros: Requer autenticação e cargo 'admin'
router.put('/passageiros/:id', protect, authorize('admin'), [
    // Adicionar validações para os campos que podem ser atualizados
    check('nome').optional().notEmpty().withMessage('Nome não pode ser vazio se fornecido'),
    check('cpf').optional().isLength({ min: 11, max: 11 }).withMessage('CPF inválido se fornecido'),
    check('vooId').optional().isMongoId().withMessage('ID do voo inválido se fornecido')
], passageiroController.editUser);
router.delete('/passageiros/:id', protect, authorize('admin'), passageiroController.deleteUser);
router.patch('/passageiros/:id/checkin', protect, authorize('admin'), passageiroController.realizarCheckIn); // Check-in também precisa ser admin para alterar


// --- ROTAS DE VOO ---
// POST /voos: AGORA REQUER AUTENTICAÇÃO E CARGO 'admin'
router.post('/voos', protect, authorize('admin'), [ // Adicionado authorize('admin')
    check('numeroVoo').notEmpty().withMessage('Número do voo é obrigatório'),
    check('origem').notEmpty().withMessage('Origem é obrigatória'),
    check('destino').notEmpty().withMessage('Destino é obrigatório'),
    check('dataHoraPartida').isISO8601().withMessage('Data inválida'),
    check('portaoId').isMongoId().withMessage('ID do portão inválido')
], vooController.createVoo);

// PUT, DELETE /voos: Requer autenticação e cargo 'admin'
router.put('/voos/:id/status', protect, authorize('admin'), [
    check('novoStatus').isIn(['programado', 'embarque', 'concluido']).withMessage('Status inválido')
], vooController.updateStatus);

router.get('/voos', vooController.getAllVoos);
router.get('/voos/:id', vooController.getVoo);
router.delete('/voos/:id', protect, authorize('admin'), vooController.deleteVoo);


// --- ROTAS DE PORTAO (GATE) ---
// POST /portoes: AGORA REQUER AUTENTICAÇÃO E CARGO 'admin'
router.post('/portoes', protect, authorize('admin'), [ // Adicionado authorize('admin')
    check('codigo').notEmpty().withMessage('Código é obrigatório'),
    // O schema de Portao (models/portao.js) não possui 'terminal'. Se for necessário, adicione ao schema.
    // check('terminal').notEmpty().withMessage('Terminal é obrigatório')
], portaoController.createPortao);

// PUT, DELETE /portoes: Requer autenticação e cargo 'admin'
router.get('/portoes', portaoController.getAllPortoes);
router.get('/portoes/:id', portaoController.getPortao);
router.put('/portoes/:id', protect, authorize('admin'), [
    check('codigo').optional().notEmpty().withMessage('Código não pode ser vazio se fornecido'),
    // check('terminal').optional().notEmpty(),
    check('disponivel').optional().isBoolean().withMessage('Disponibilidade deve ser um valor booleano')
], portaoController.updatePortao);
router.delete('/portoes/:id', protect, authorize('admin'), portaoController.deletePortao);

// --- ROTAS DE RELATÓRIOS ---
// Decida se precisam de autenticação. Geralmente sim.
// Aqui, protegemos para qualquer usuário autenticado. Se precisar de admin, adicione authorize('admin').
router.get('/hoje', protect, relatoriosController.listarVoosHoje);
router.get('/voos/:idVoo/passageiros', protect, relatoriosController.listarPassageirosPorVoo);
router.get('/relatorio/diario', protect, relatoriosController.relatorioDiario);
router.get('/relatorio/portoes', protect, relatoriosController.listarPortoesAtribuidos);

module.exports = router;