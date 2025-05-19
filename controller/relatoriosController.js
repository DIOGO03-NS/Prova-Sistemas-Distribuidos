const Voo = require('../models/voo');
const Passageiro = require('../models/passageiro');
const Portao = require('../models/portao');
const { validationResult, matchedData } = require('express-validator');

// vooController.js
const listarVoosHoje = async (req, res) => {
    try {
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);
  
      const voos = await Voo.find({
        dataHoraPartida: {
          $gte: hojeInicio,
          $lte: hojeFim
        },
        status: 'programado'
      })
      .populate('portaoId', 'codigo terminal')
      .select('numeroVoo origem destino dataHoraPartida portaoId')
      .lean();
  
      res.json({
        data: voos,
        total: voos.length
      });
  
    } catch (error) {
      console.error('Erro ao listar voos:', error);
      res.status(500).json({ 
        message: 'Erro ao listar voos',
        error: error.message 
      });
    }
  };

  // vooController.js
const listarPassageirosPorVoo = async (req, res) => {
    try {
      const { idVoo } = req.params;
  
      const passageiros = await Passageiro.find({ vooId: idVoo })
        .select('nome cpf statusCheckIn')
        .sort({ statusCheckIn: 1, nome: 1 }) // Ordena por status e nome
        .lean();
  
      const voo = await Voo.findById(idVoo)
        .select('numeroVoo origem destino dataHoraPartida portaoId')
        .populate('portaoId', 'codigo terminal')
        .lean();
  
      if (!voo) {
        return res.status(404).json({ message: 'Voo não encontrado' });
      }
  
      res.json({
        voo,
        passageiros,
        totalPassageiros: passageiros.length,
        checkinsRealizados: passageiros.filter(p => p.statusCheckIn === 'realizado').length
      });
  
    } catch (error) {
      console.error('Erro ao listar passageiros:', error);
      res.status(500).json({ 
        message: 'Erro ao listar passageiros',
        error: error.message 
      });
    }
  };

// relatorioController.js
const relatorioDiario = async (req, res) => {
    try {
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);
  
      // 1. Busca todos os voos do dia
      const voos = await Voo.find({
        dataHoraPartida: {
          $gte: hojeInicio,
          $lte: hojeFim
        }
      })
      .populate('portaoId', 'codigo terminal')
      .lean();
  
      // 2. Para cada voo, busca os passageiros
      const voosComPassageiros = await Promise.all(
        voos.map(async voo => {
          const passageiros = await Passageiro.find({ vooId: voo._id })
            .select('nome cpf statusCheckIn')
            .lean();
  
          return {
            ...voo,
            passageiros,
            totalPassageiros: passageiros.length,
            checkinsRealizados: passageiros.filter(p => p.statusCheckIn === 'realizado').length
          };
        })
      );
  
      // 3. Calcula totais gerais
      const totalVoos = voosComPassageiros.length;
      const totalPassageiros = voosComPassageiros.reduce((sum, voo) => sum + voo.totalPassageiros, 0);
      const totalCheckins = voosComPassageiros.reduce((sum, voo) => sum + voo.checkinsRealizados, 0);
  
      res.json({
        data: voosComPassageiros,
        resumo: {
          totalVoos,
          totalPassageiros,
          totalCheckins,
          percentualCheckin: totalPassageiros > 0 
            ? Math.round((totalCheckins / totalPassageiros) * 100) 
            : 0
        }
      });
  
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ 
        message: 'Erro ao gerar relatório diário',
        error: error.message 
      });
    }
  };

  // lista voos atribuidos
  const listarPortoesAtribuidos = async (req, res) => {
    try {
      const portoes = await Portao.find({ disponivel: false })
        .select('codigo terminal')
        .lean();
  
      // Você pode incluir os voos associados, se quiser.
      // Exemplo (opcional):
      const voos = await Voo.find({ status: { $ne: 'concluido' } })
        .select('numeroVoo portaoId')
        .lean();
  
      const portoesComVoos = portoes.map(portao => {
        const vooAssociado = voos.find(v => v.portaoId?.toString() === portao._id.toString());
        return {
          ...portao,
          voo: vooAssociado ? vooAssociado.numeroVoo : null
        };
      });
  
      res.json({
        data: portoesComVoos,
        total: portoes.length
      });
  
    } catch (error) {
      console.error('Erro ao listar portões atribuídos:', error);
      res.status(500).json({ 
        message: 'Erro ao listar portões atribuídos',
        error: error.message 
      });
    }
  };

  module.exports = {
    listarPassageirosPorVoo,
    relatorioDiario,
    listarVoosHoje,
    listarPortoesAtribuidos
  }