const Voo = require('../models/voo');
const Passageiro = require('../models/passageiro');
const Portao = require('../models/portao');
const { validationResult, matchedData } = require('express-validator');

// 1. CRIAR VOO
const createVoo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { numeroVoo, origem, destino, dataHoraPartida, portaoId } = matchedData(req);

    // Verifica se o portão está disponível
    const portao = await Portao.findById(portaoId);
    if (!portao.disponivel) {
      return res.status(400).json({ message: 'Portão já está em uso' });
    }

    // Cria o voo
    const novoVoo = await Voo.create({
      numeroVoo,
      origem,
      destino,
      dataHoraPartida,
      portaoId,
      status: 'programado'
    });

    // Atualiza o portão para indisponível
    await Portao.findByIdAndUpdate(portaoId, { disponivel: false });

    res.status(201).json({
      message: 'Voo criado com sucesso!',
      voo: novoVoo
    });

  } catch (error) {
    console.error('Erro ao criar voo:', error);
    res.status(500).json({ 
      message: 'Erro ao criar voo',
      error: error.message 
    });
  }
};

// 2. ATUALIZAR STATUS DO VOO
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { novoStatus } = req.body;

    // Validações básicas
    if (!['programado', 'embarque', 'concluido'].includes(novoStatus)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const voo = await Voo.findById(id);
    if (!voo) return res.status(404).json({ message: 'Voo não encontrado' });

    // Regra: Só pode mudar para "embarque" se estiver "programado"
    if (novoStatus === 'embarque' && voo.status !== 'programado') {
      return res.status(400).json({ message: 'Só é possível iniciar embarque para voos programados' });
    }

    // Regra: Ao concluir voo, libera o portão
    if (novoStatus === 'concluido') {
      await Portao.findByIdAndUpdate(voo.portaoId, { disponivel: true });
    }

    // Atualiza o status
    voo.status = novoStatus;
    await voo.save();

    res.json({
      message: `Status do voo atualizado para ${novoStatus}`,
      voo
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar status',
      error: error.message 
    });
  }
};

// 3. ATUALIZAR CHECKIN DO PASSAGEIRO
const updateCheckin = async (req, res) => {
  try {
    const { passageiroId } = req.params;
    const { vooId } = req.body;

    // Verifica se o voo está em status de embarque
    const voo = await Voo.findById(vooId);
    if (voo.status !== 'embarque') {
      return res.status(400).json({ 
        message: 'Check-in só permitido quando o voo está em status "embarque"' 
      });
    }

    // Atualiza o passageiro
    const passageiro = await Passageiro.findByIdAndUpdate(
      passageiroId,
      { 
        vooId,
        statusCheckIn: 'realizado' 
      },
      { new: true }
    ).populate('vooId');

    if (!passageiro) {
      return res.status(404).json({ message: 'Passageiro não encontrado' });
    }

    res.json({
      message: 'Check-in realizado com sucesso!',
      passageiro
    });

  } catch (error) {
    console.error('Erro ao atualizar check-in:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar check-in',
      error: error.message 
    });
  }
};

// 4. BUSCAR TODOS OS VOOS
const getAllVoos = async (req, res) => {
  try {
    const voos = await Voo.find().populate('portaoId');
    res.json({ voos });
  } catch (error) {
    console.error('Erro ao buscar voos:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar voos',
      error: error.message 
    });
  }
};

// 5. BUSCAR VOO POR ID
const getVoo = async (req, res) => {
  try {
    const voo = await Voo.findById(req.params.id)
      .populate('portaoId')
      .populate('passageiros'); // Se tiver referência a passageiros

    if (!voo) {
      return res.status(404).json({ message: 'Voo não encontrado' });
    }

    res.json({ voo });
  } catch (error) {
    console.error('Erro ao buscar voo:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar voo',
      error: error.message 
    });
  }
};

const deleteVoo = async (req, res) => {
    try {
      const { id } = req.params;
  
      // 1. Verifica se o voo existe
      const voo = await Voo.findById(id);
      if (!voo) {
        return res.status(404).json({ message: 'Voo não encontrado' });
      }
  
      // 2. Verifica se há passageiros vinculados
      const passageirosVinculados = await Passageiro.countDocuments({ vooId: id });
      if (passageirosVinculados > 0) {
        return res.status(400).json({ 
          message: 'Não é possível deletar voo com passageiros vinculados' 
        });
      }
  
      // 3. Se o voo está ativo, libera o portão
      if (voo.status !== 'concluido') {
        await Portao.findByIdAndUpdate(voo.portaoId, { disponivel: true });
      }
  
      // 4. Remove o voo
      await Voo.findByIdAndDelete(id);
  
      res.json({ message: 'Voo deletado com sucesso!' });
  
    } catch (error) {
      console.error('Erro ao deletar voo:', error);
      res.status(500).json({ 
        message: 'Erro ao deletar voo',
        error: error.message 
      });
    }
  };

module.exports = {
  createVoo,
  updateStatus,
  updateCheckin,
  getAllVoos,
  getVoo,
  deleteVoo
};