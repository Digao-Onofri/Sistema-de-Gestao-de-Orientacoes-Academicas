'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { CicloOrientacao, Curso, PeriodoLetivo, PropostaAcademica, Usuario, DecisaoSolicitacao } from '../types';
import type { ResultadoAcao, SolicitacaoR03 } from './release03-model';
import { dataValida, hojeInstitucional, transicoes } from './release03-model';
import { lerR03, gravarR03 } from './release03-store';
import { usuarioR03 } from './release03-access';
import { registrarAuditoriaEstrita } from './auditoria';
import { criarNotificacaoEstrita } from './notificacoes';

const texto = (f: FormData, chave: string) => typeof f.get(chave) === 'string' ? String(f.get(chave)).trim() : '';
function atualizar(mensagem?: string) {
  ['/ciclos', '/solicitacoes', '/relatorio-solicitacoes'].forEach(p => revalidatePath(p));
  return mensagem ? { sucesso: true, mensagem } : { sucesso: true };
}
function validarCiclo(c: CicloOrientacao, permitirCursoInativo = false) {
  const curso = lerR03<Curso>('cursos.json').find(v => v.id === c.cursoId);
  if (!curso || (!permitirCursoInativo && curso.situacao !== 'Ativo')) return 'Selecione um curso ativo.';
  if (!lerR03<PeriodoLetivo>('periodos.json').some(p => p.id === c.periodoId)) return 'Período letivo inválido.';
  if (!['TCC', 'IC'].includes(c.modalidade)) return 'Modalidade inválida.';
  if (!dataValida(c.prazoInicio) || !dataValida(c.prazoFim) || c.prazoFim < c.prazoInicio) return 'Informe datas válidas; o encerramento deve ser igual ou posterior ao início.';
  if (!c.elegibilidade || !c.regras) return 'Elegibilidade e regras são obrigatórias.';
  if (c.elegibilidade.length > 5000 || c.regras.length > 5000) return 'Utilize até 5.000 caracteres por campo.';
}

export async function salvarCicloAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (usuario?.perfil !== 'Coordenador') return { erro: 'Apenas coordenadores podem administrar ciclos.' };
    const ciclos = lerR03<CicloOrientacao>('ciclos.json');
    const id = texto(f, 'id');
    const anterior = ciclos.find(c => c.id === id);
    if (id && !anterior) return { erro: 'Ciclo não encontrado.' };
    if (anterior && anterior.situacao !== 'Rascunho') return { erro: 'Somente rascunhos podem ser editados. As regras dos ciclos publicados são preservadas.' };
    const ciclo: CicloOrientacao = {
      id: anterior?.id ?? randomUUID(), cursoId: texto(f, 'cursoId'), periodoId: texto(f, 'periodoId'),
      modalidade: texto(f, 'modalidade') as CicloOrientacao['modalidade'], prazoInicio: texto(f, 'prazoInicio'),
      prazoFim: texto(f, 'prazoFim'), elegibilidade: texto(f, 'elegibilidade'), regras: texto(f, 'regras'), situacao: 'Rascunho',
    };
    const erro = validarCiclo(ciclo);
    if (erro) return { erro };
    gravarR03('ciclos.json', anterior ? ciclos.map(c => c.id === id ? ciclo : c) : [...ciclos, ciclo]);
    try {
      const u = usuario;
      if (u) await registrarAuditoriaEstrita(u.id, u.email, 'CicloOrientacao', anterior ? 'EDICAO' : 'CRIACAO', `Ciclo ${ciclo.id} ${anterior ? 'editado' : 'criado'}.`);
    } catch {}
    return atualizar();
  } catch { return { erro: 'Não foi possível salvar. Verifique a integridade e a permissão dos arquivos JSON.' }; }
}

export async function mudarCicloAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    if ((await usuarioR03())?.perfil !== 'Coordenador') return { erro: 'Apenas coordenadores podem administrar ciclos.' };
    const ciclos = lerR03<CicloOrientacao>('ciclos.json');
    const ciclo = ciclos.find(c => c.id === texto(f, 'id'));
    const destino = texto(f, 'situacao');
    if (!ciclo || !transicoes[ciclo.situacao]?.includes(destino)) return { erro: 'Transição de situação inválida ou ciclo já atualizado. Recarregue a página.' };
    if (destino === 'Publicado' || destino === 'Aberto') {
      const erro = validarCiclo(ciclo);
      if (erro) return { erro };
      if (ciclo.prazoFim < hojeInstitucional()) return { erro: 'O prazo deste ciclo já terminou.' };
    }
    ciclo.situacao = destino as CicloOrientacao['situacao'];
    gravarR03('ciclos.json', ciclos);
    try {
      const u = await usuarioR03();
      if (u) await registrarAuditoriaEstrita(u.id, u.email, 'CicloOrientacao', 'ALTERACAO_SITUACAO', `Ciclo ${ciclo.id} alterado para ${destino}.`);
    } catch {}
    return atualizar(destino === 'Cancelado' ? 'Ciclo cancelado. Os registros e o histórico foram preservados.' : undefined);
  } catch { return { erro: 'Não foi possível atualizar o ciclo. Verifique os arquivos JSON.' }; }
}

export async function criarSolicitacaoAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  return salvarSolicitacao(f);
}

export async function editarSolicitacaoAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  const id = texto(f, 'id');
  if (!id) return { erro: 'Solicitação não encontrada.' };
  return salvarSolicitacao(f, id);
}

// A criação e a edição compartilham as validações de proposta, ciclo e tutores.
async function salvarSolicitacao(f: FormData, id?: string): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (usuario?.perfil !== 'Tutorado') return { erro: 'Apenas tutorados ativos podem criar solicitações próprias.' };
    const solicitacoes = lerR03<SolicitacaoR03>('solicitacoes.json');
    const anterior = id ? solicitacoes.find(s => s.id === id && s.tutoradoId === usuario.id) : undefined;
    if (id && !anterior) return { erro: 'Solicitação não encontrada ou sem permissão.' };
    if (anterior && (anterior.situacao !== 'Pendente' || anterior.decisao)) return { erro: 'Somente solicitações pendentes e sem decisão podem ser editadas.' };
    if (anterior && texto(f, 'cicloId') !== anterior.cicloId) return { erro: 'O ciclo de uma solicitação enviada não pode ser alterado.' };
    const ciclo = lerR03<CicloOrientacao>('ciclos.json').find(c => c.id === texto(f, 'cicloId'));
    const hoje = hojeInstitucional();
    if (!ciclo || ciclo.situacao !== 'Aberto' || hoje < ciclo.prazoInicio || hoje > ciclo.prazoFim) return { erro: 'O ciclo deve estar aberto e dentro do prazo de solicitação.' };
    const proposta = lerR03<PropostaAcademica>('propostas.json').find(p => p.id === texto(f, 'propostaId') && p.tutoradoId === usuario.id);
    if (!proposta) return { erro: 'Selecione uma proposta de sua autoria.' };
    if (proposta.tipo !== ciclo.modalidade) return { erro: 'A modalidade da proposta deve corresponder à do ciclo.' };
    const tutores = f.getAll('tutoresPreferidos').filter((v): v is string => typeof v === 'string');
    if (!tutores.length || new Set(tutores).size !== tutores.length) return { erro: 'Informe ao menos um tutor, sem repetir preferências.' };
    const usuarios = lerR03<Usuario>('usuarios.json');
    if (tutores.some(id => !usuarios.some(u => u.id === id && u.perfil === 'Tutor' && u.situacao === 'Ativa' && u.tiposOrientacao?.includes(ciclo.modalidade)))) return { erro: 'Os tutores devem estar ativos e oferecer a modalidade do ciclo.' };
    if (f.get('elegibilidadeDeclarada') !== 'on') return { erro: 'Leia as regras e declare que atende aos critérios de elegibilidade.' };
    if (solicitacoes.some(s => s.id !== id && s.cicloId === ciclo.id && s.propostaId === proposta.id)) return { erro: 'Já existe uma solicitação para esta proposta neste ciclo, inclusive no histórico de cancelamentos.' };
    const nova: SolicitacaoR03 = { ...anterior, id: anterior?.id ?? randomUUID(), cicloId: ciclo.id, propostaId: proposta.id, tutoradoId: usuario.id,
      tutoresPreferidos: tutores, situacao: 'Pendente', dataSolicitacao: anterior?.dataSolicitacao ?? new Date().toISOString(),
      propostaSubmetida: structuredClone(proposta), elegibilidadeDeclarada: true };
    if (anterior) nova.dataAtualizacao = new Date().toISOString();
    gravarR03('solicitacoes.json', anterior ? solicitacoes.map(s => s.id === id ? nova : s) : [...solicitacoes, nova]);
    try {
      if (anterior) {
        await registrarAuditoriaEstrita(usuario.id, usuario.email, 'SolicitacaoOrientacao', 'EDICAO', `Solicitação ${nova.id} editada.`);
      } else {
        await registrarAuditoriaEstrita(usuario.id, usuario.email, 'SolicitacaoOrientacao', 'CRIACAO', `Solicitação ${nova.id} criada.`);
        const usuarios = lerR03<Usuario>('usuarios.json');
        const set = new Set<string>();
        for (const tid of nova.tutoresPreferidos || []) {
          if (!set.has(tid)) {
            set.add(tid);
            try { await criarNotificacaoEstrita(tid, 'SolicitacaoRecebida', 'Recebimento de solicitação.', nova.id); } catch {}
          }
        }
      }
    } catch {}
    return atualizar();
  } catch { return { erro: 'Não foi possível registrar a solicitação. Verifique os arquivos JSON.' }; }
}

export async function cancelarSolicitacaoAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (usuario?.perfil !== 'Tutorado') return { erro: 'Apenas tutorados ativos podem cancelar solicitações próprias.' };
    const solicitacoes = lerR03<SolicitacaoR03>('solicitacoes.json');
    const s = solicitacoes.find(s => s.id === texto(f, 'id') && s.tutoradoId === usuario.id);
    if (!s) return { erro: 'Solicitação não encontrada ou sem permissão.' };
    if (s.situacao !== 'Pendente' || s.decisao) return { erro: 'Somente solicitações pendentes e sem decisão podem ser canceladas.' };
    if (!s.propostaSubmetida) {
      const proposta = lerR03<PropostaAcademica>('propostas.json').find(p => p.id === s.propostaId);
      if (proposta) s.propostaSubmetida = structuredClone(proposta);
    }
    s.situacao = 'Cancelada';
    s.cancelamento = { dataCancelamento: new Date().toISOString(), tutoradoId: usuario.id };
    gravarR03('solicitacoes.json', solicitacoes);
    try {
      await registrarAuditoriaEstrita(usuario.id, usuario.email, 'SolicitacaoOrientacao', 'CANCELAMENTO', `Solicitação ${s.id} cancelada.`);
    } catch {}
    return atualizar('Solicitação cancelada. O registro foi mantido no histórico.');
  } catch { return { erro: 'Não foi possível cancelar a solicitação. Verifique os arquivos JSON.' }; }
}

export async function decidirSolicitacaoAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (usuario?.perfil !== 'Tutor') return { erro: 'Apenas tutores ativos podem registrar decisões.' };
    const solicitacoes = lerR03<SolicitacaoR03>('solicitacoes.json');
    const s = solicitacoes.find(s => s.id === texto(f, 'id'));
    if (!s || !s.tutoresPreferidos.includes(usuario.id)) return { erro: 'Solicitação não encontrada ou sem permissão.' };
    if (s.situacao !== 'Pendente' || s.decisao) return { erro: 'Somente solicitações pendentes e sem decisão podem ser avaliadas. Recarregue a página.' };
    const ciclo = lerR03<CicloOrientacao>('ciclos.json').find(c => c.id === s.cicloId);
    if (!ciclo || ciclo.situacao === 'Cancelado') return { erro: 'Não é possível decidir uma solicitação de ciclo cancelado ou inexistente.' };
    const resultado = texto(f, 'resultado');
    if (!['Aceitar', 'Recusar', 'SolicitarComplementacao'].includes(resultado)) return { erro: 'Decisão inválida.' };
    const justificativa = texto(f, 'justificativa');
    if (resultado !== 'Aceitar' && !justificativa) return { erro: 'Informe a justificativa para recusar ou solicitar complementação.' };
    if (justificativa.length > 5000) return { erro: 'Utilize até 5.000 caracteres na justificativa.' };
    // Migração aditiva de registros antigos: captura o conteúdo disponível antes de decidir.
    if (!s.propostaSubmetida) {
      const proposta = lerR03<PropostaAcademica>('propostas.json').find(p => p.id === s.propostaId);
      if (!proposta) return { erro: 'A proposta relacionada não está disponível.' };
      s.propostaSubmetida = structuredClone(proposta);
    }
    s.decisao = { resultado: resultado as DecisaoSolicitacao['resultado'], justificativa, tutorId: usuario.id, dataDecisao: new Date().toISOString() };
    s.situacao = resultado === 'Aceitar' ? 'Aceita' : resultado === 'Recusar' ? 'Recusada' : 'AguardandoComplementacao';
    gravarR03('solicitacoes.json', solicitacoes);
    try {
      await registrarAuditoriaEstrita(usuario.id, usuario.email, 'SolicitacaoOrientacao', 'DECISAO', `Decisão registrada para solicitação ${s.id}.`);
    } catch {}
    try {
      const rotulo = resultado === 'Aceitar' ? 'Aceita' : resultado === 'Recusar' ? 'Recusada' : 'Aguardando complementação';
      await criarNotificacaoEstrita(s.tutoradoId, 'DecisaoSolicitacao', rotulo, s.id);
    } catch {}
    return atualizar();
  } catch { return { erro: 'Não foi possível registrar a decisão. Verifique os arquivos JSON.' }; }
}
