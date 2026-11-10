#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function hashSenha(senha) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(senha, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  const base = process.cwd();
  const destino = process.env.DEMO_DIR || path.join(base, 'data', 'manual-r04');
  fs.mkdirSync(destino, { recursive: true });

  const coordSenha = await hashSenha('demo-coord-123');
  const tutorSenha = await hashSenha('demo-tutor-123');
  const tutoradoSenha = await hashSenha('demo-tutorado-123');

  const usuarios = [
    { id: 'demo-coord-1', email: 'coord.demo@sgoa.test', senha: coordSenha, perfil: 'Coordenador', situacao: 'Ativa', nome: 'Coordenador Demo' },
    { id: 'demo-tutor-1', email: 'tutor.demo@sgoa.test', senha: tutorSenha, perfil: 'Tutor', situacao: 'Ativa', nome: 'Tutor Demo', apresentacao: 'Tutor para testes R04', areasInteresse: ['Engenharia'], tiposOrientacao: ['TCC'], disponibilidade: 'Segunda a Sexta', limiteOrientandos: 3 },
    { id: 'demo-tutorado-1', email: 'tutorado.demo@sgoa.test', senha: tutoradoSenha, perfil: 'Tutorado', situacao: 'Ativa', nome: 'Tutorado Demo', dadosAcademicos: 'Curso Teste - 2026' },
  ];

  const unidades = [{ id: 'demo-unidade-1', denominacao: 'Unidade Demo' }];
  const cursos = [{ id: 'demo-curso-1', denominacao: 'Curso Demo', unidadeId: 'demo-unidade-1', situacao: 'Ativo' }];
  const periodos = [{ id: 'demo-periodo-1', identificacao: '2026/2' }];
  const ciclos = [{ id: 'demo-ciclo-1', cursoId: 'demo-curso-1', periodoId: 'demo-periodo-1', modalidade: 'TCC', prazoInicio: '2026-08-01', prazoFim: '2026-12-31', elegibilidade: 'Elegível', regras: 'Regras demo', situacao: 'Aberto' }];
  const propostas = [{ id: 'demo-proposta-1', tutoradoId: 'demo-tutorado-1', titulo: 'Proposta Demo R04', resumo: 'Resumo para testes', palavrasChave: ['demo'], tipo: 'TCC' }];
  const solicitacoes = [{ id: 'demo-solic-1', cicloId: 'demo-ciclo-1', propostaId: 'demo-proposta-1', tutoradoId: 'demo-tutorado-1', tutoresPreferidos: ['demo-tutor-1'], situacao: 'Pendente', dataSolicitacao: new Date().toISOString() }];
  const alocacoes = [
    { id: 'demo-aloc-ativa-1', tutorId: 'demo-tutor-1', tutoradoId: 'demo-tutorado-1', propostaId: 'demo-proposta-1', cicloId: 'demo-ciclo-1', situacao: 'Ativa', dataConfirmacao: new Date().toISOString(), coordenadorId: 'demo-coord-1' },
    { id: 'demo-aloc-encerrada-1', tutorId: 'demo-tutor-1', tutoradoId: 'demo-tutorado-1', propostaId: 'demo-proposta-1', cicloId: 'demo-ciclo-1', situacao: 'Encerrada', dataConfirmacao: new Date(Date.now()-86400000).toISOString(), coordenadorId: 'demo-coord-1', motivo: 'Encerramento demo', dataEncerramento: new Date().toISOString(), responsavelAcaoId: 'demo-coord-1' },
    { id: 'demo-aloc-cancelada-1', tutorId: 'demo-tutor-1', tutoradoId: 'demo-tutorado-1', propostaId: 'demo-proposta-1', cicloId: 'demo-ciclo-1', situacao: 'Cancelada', dataConfirmacao: new Date(Date.now()-172800000).toISOString(), coordenadorId: 'demo-coord-1', motivo: 'Cancelamento demo', dataCancelamento: new Date().toISOString(), responsavelAcaoId: 'demo-coord-1' },
  ];
  const etapas = [{ id: 'demo-etapa-1', alocacaoId: 'demo-aloc-ativa-1', descricao: 'Revisar proposta', responsavel: 'Tutor Demo', prazo: '2026-11-15', situacao: 'Pendente' }];
  const reunioes = [{ id: 'demo-reuniao-1', alocacaoId: 'demo-aloc-ativa-1', data: '2026-11-10', resumo: 'Alinhamento inicial', encaminhamentos: 'Enviar documento', proximoContato: '2026-11-17' }];
  const notificacoes = [{ id: 'demo-notif-1', usuarioId: 'demo-tutor-1', tipoEvento: 'SolicitacaoRecebida', descricao: 'Recebimento de solicitação.', dataHora: new Date().toISOString(), referencia: 'demo-solic-1', lida: false }];
  const auditoria = [{ id: 'demo-audit-1', dataHora: new Date().toISOString(), usuarioId: 'demo-coord-1', usuarioEmail: 'coord.demo@sgoa.test', entidade: 'AlocacaoOrientacao', tipoAcao: 'CONFIRMACAO', detalhes: 'Alocação confirmada (demo).' }];

  const files = { usuarios, unidades, cursos, periodos, ciclos, propostas, solicitacoes, alocacoes, etapas, reunioes, notificacoes, auditoria };
  for (const [k,v] of Object.entries(files)) {
    fs.writeFileSync(path.join(destino, `${k}.json`), JSON.stringify(v, null, 2));
  }

  console.log('Demo criado em:', destino);
  console.log('Credenciais:');
  console.log('  Coordenador: coord.demo@sgoa.test / demo-coord-123');
  console.log('  Tutor: tutor.demo@sgoa.test / demo-tutor-123');
  console.log('  Tutorado: tutorado.demo@sgoa.test / demo-tutorado-123');
}

main().catch(e => { console.error(e); process.exit(1); });
