// rotas do tipo get serão públicas serão publicas
// rotas post usuarios autenticados
// put e delete apenas para usuários autenticados admin 

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

// --- ROTAS DE AUTENTICAÇÃO (Públicas por natureza) ---
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
// POST: Requer autenticação
router.post('/passageiros', protect, [
    check('nome').notEmpty().withMessage('Nome é obrigatório'),
    check('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF inválido'),
    check('vooId').isMongoId().withMessage('ID do voo inválido')
], passageiroController.createUser);

// GETs: Públicas
router.get('/passageiros', passageiroController.getAllUsers);
router.get('/passageiros/:id', passageiroController.getUser);

// PUT, DELETE, PATCH: Requer autenticação e cargo 'admin'
router.put('/passageiros/:id', protect, authorize('admin'), [
    check('nome').optional().notEmpty().withMessage('Nome não pode ser vazio se fornecido'),
    check('cpf').optional().isLength({ min: 11, max: 11 }).withMessage('CPF inválido se fornecido'),
    check('vooId').optional().isMongoId().withMessage('ID do voo inválido se fornecido')
], passageiroController.editUser);
router.delete('/passageiros/:id', protect, authorize('admin'), passageiroController.deleteUser);
router.patch('/passageiros/:id/checkin', protect, authorize('admin'), passageiroController.realizarCheckIn);


// --- ROTAS DE VOO ---
// POST: Requer autenticação
router.post('/voos', protect, [
    check('numeroVoo').notEmpty().withMessage('Número do voo é obrigatório'),
    check('origem').notEmpty().withMessage('Origem é obrigatória'),
    check('destino').notEmpty().withMessage('Destino é obrigatório'),
    check('dataHoraPartida').isISO8601().withMessage('Data inválida'),
    check('portaoId').isMongoId().withMessage('ID do portão inválido')
], vooController.createVoo);

// GETs: Públicas
router.get('/voos', vooController.getAllVoos);
router.get('/voos/:id', vooController.getVoo);

// PUT, DELETE: Requer autenticação e cargo 'admin'
router.put('/voos/:id/status', protect, authorize('admin'), [
    check('novoStatus').isIn(['programado', 'embarque', 'concluido']).withMessage('Status inválido')
], vooController.updateStatus);
router.delete('/voos/:id', protect, authorize('admin'), vooController.deleteVoo);


// --- ROTAS DE PORTAO (GATE) ---
// POST: Requer autenticação
router.post('/portoes', protect, [
    check('codigo').notEmpty().withMessage('Código é obrigatório'),
], portaoController.createPortao);

// GETs: Públicas
router.get('/portoes', portaoController.getAllPortoes);
router.get('/portoes/:id', portaoController.getPortao);

// PUT, DELETE: Requer autenticação e cargo 'admin'
router.put('/portoes/:id', protect, authorize('admin'), [
    check('codigo').optional().notEmpty().withMessage('Código não pode ser vazio se fornecido'),
    check('disponivel').optional().isBoolean().withMessage('Disponibilidade deve ser um valor booleano')
], portaoController.updatePortao);
router.delete('/portoes/:id', protect, authorize('admin'), portaoController.deletePortao);

// --- ROTAS DE RELATÓRIOS ---
// GETs: Públicas
router.get('/hoje', relatoriosController.listarVoosHoje);
router.get('/voos/:idVoo/passageiros', relatoriosController.listarPassageirosPorVoo);
router.get('/relatorio/diario', relatoriosController.relatorioDiario);
router.get('/relatorio/portoes', relatoriosController.listarPortoesAtribuidos);

module.exports = router;