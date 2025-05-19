const Portao = require('../models/portao');
const Voo = require('../models/voo');
const { validationResult, matchedData } = require('express-validator');

// 1. CRIAR PORTÃO
const createPortao = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { codigo, terminal } = matchedData(req);
    
    // Verifica se código já existe
    const portaoExistente = await Portao.findOne({ codigo });
    if (portaoExistente) {
      return res.status(400).json({ message: 'Código do portão já está em uso' });
    }

    const novoPortao = await Portao.create({
      codigo,
      terminal,
      disponivel: true
    });

    res.status(201).json({
      message: 'Portão criado com sucesso!',
      portao: novoPortao
    });

  } catch (error) {
    console.error('Erro ao criar portão:', error);
    res.status(500).json({ 
      message: 'Erro ao criar portão',
      error: error.message 
    });
  }
};

// 2. LISTAR TODOS OS PORTÕES
const getAllPortoes = async (req, res) => {
  try {
    // Filtro por disponibilidade (opcional)
    const { disponivel } = req.query;
    const filtro = {};
    
    if (disponivel !== undefined) {
      filtro.disponivel = disponivel === 'true';
    }

    const portoes = await Portao.find(filtro);
    res.json({ portoes });

  } catch (error) {
    console.error('Erro ao buscar portões:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar portões',
      error: error.message 
    });
  }
};

// 3. OBTER DETALHES DO PORTÃO
const getPortao = async (req, res) => {
  try {
    const portao = await Portao.findById(req.params.id)
      .populate({
        path: 'vooAtual',
        select: 'numeroVoo origem destino status'
      });

    if (!portao) {
      return res.status(404).json({ message: 'Portão não encontrado' });
    }

    res.json({ portao });

  } catch (error) {
    console.error('Erro ao buscar portão:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar portão',
      error: error.message 
    });
  }
};

// 4. ATUALIZAR PORTÃO

// 4. ATUALIZAR PORTÃO
const updatePortao = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { codigo, terminal, disponivel } = matchedData(req, { locations: ['body'] });

    // Verifica se o portão existe
    const portao = await Portao.findById(id);
    if (!portao) {
      return res.status(404).json({ message: 'Portão não encontrado' });
    }

    // Verifica se está tentando liberar um portão que está atualmente em uso
    if (disponivel === true && portao.disponivel === false) {
      const vooAtivo = await Voo.findOne({
        portaoId: id,
        status: { $in: ['programado', 'embarque'] }
      });

      if (vooAtivo) {
        return res.status(400).json({
          message: 'Não é possível liberar o portão enquanto há um voo ativo vinculado'
        });
      }
    }

    // Monta somente os campos atualizados
    const updates = {};
    if (codigo !== undefined) updates.codigo = codigo;
    if (terminal !== undefined) updates.terminal = terminal;
    if (disponivel !== undefined) updates.disponivel = disponivel;

    const portaoAtualizado = await Portao.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Portão atualizado com sucesso!',
      portao: portaoAtualizado
    });

  } catch (error) {
    console.error(`Erro ao atualizar portão com id ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Erro ao atualizar portão',
      error: error.message
    });
  }
};


// const updatePortao = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { id } = req.params;
//     const { codigo, terminal, disponivel } = matchedData(req);

//     // Verifica se o portão existe
//     const portao = await Portao.findById(id);
//     if (!portao) {
//       return res.status(404).json({ message: 'Portão não encontrado' });
//     }

//     // Verifica se está tentando liberar um portão em uso
//     if (disponivel === true && !portao.disponivel) {
//       const vooAtivo = await Voo.findOne({ 
//         portaoId: id, 
//         status: { $in: ['programado', 'embarque'] } 
//       });
      
//       if (vooAtivo) {
//         return res.status(400).json({ 
//           message: 'Não é possível liberar o portão enquanto há um voo ativo vinculado' 
//         });
//       }
//     }

//     const portaoAtualizado = await Portao.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

//     res.json({
//       message: 'Portão atualizado com sucesso!',
//       portao: portaoAtualizado
//     });

//   } catch (error) {
//     console.error('Erro ao atualizar portão:', error);
//     res.status(500).json({ 
//       message: 'Erro ao atualizar portão',
//       error: error.message 
//     });
//   }
// };

// 5. DELETAR PORTÃO
const deletePortao = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o portão está em uso
    const vooVinculado = await Voo.findOne({ portaoId: id });
    if (vooVinculado) {
      return res.status(400).json({ 
        message: 'Não é possível deletar um portão vinculado a um voo' 
      });
    }

    const portao = await Portao.findByIdAndDelete(id);
    
    if (!portao) {
      return res.status(404).json({ message: 'Portão não encontrado' });
    }
    
    res.json({ message: 'Portão deletado com sucesso!' });

  } catch (error) {
    console.error('Erro ao deletar portão:', error);
    res.status(500).json({ 
      message: 'Erro ao deletar portão',
      error: error.message 
    });
  }
};

module.exports = {
  createPortao,
  getAllPortoes,
  getPortao,
  updatePortao,
  deletePortao
};