import type { FiltrosR03 } from '../libs/release03-queries';
import Link from 'next/link';
import { consultarSolicitacoes } from '../libs/release03-queries';
import type { Usuario, CicloOrientacao, Curso, PeriodoLetivo } from '../types';
import { lerR03 } from '../libs/release03-store';
import { estadosSolicitacao, rotuloSituacao, hojeInstitucional } from '../libs/release03-model';
import { decidirSolicitacaoAction, cancelarSolicitacaoAction } from '../libs/release03-actions';
import { CampoR03, campoR03, painelR03, dataR03, tituloCiclo, SituacaoR03 } from './release03-ui';
import FormR03 from './release03-form';

export function FiltrosSolicitacoes({ usuario, filtros }: { usuario: Usuario; filtros: FiltrosR03 }) {
  const visiveis = consultarSolicitacoes(usuario, {});
  const ciclos = lerR03<CicloOrientacao>('ciclos.json').filter(c => usuario.perfil === 'Coordenador' || visiveis.some(s => s.cicloId === c.id));
  const cursos = lerR03<Curso>('cursos.json'), periodos = lerR03<PeriodoLetivo>('periodos.json');
  const tutores = new Map(visiveis.flatMap(s => s.tutores.map(t => [t.id, t.nome] as const)));
  const tutorados = new Map(visiveis.map(s => [s.tutoradoId, s.tutorado]));
  const propostas = new Map(visiveis.map(s => [s.propostaId, s.proposta?.titulo ?? 'Proposta indisponível']));
  const seletor = (titulo: string, nome: string, opcoes: [string, string][]) => <CampoR03 titulo={titulo}><select name={nome} defaultValue={String(filtros[nome] ?? '')} className={campoR03}><option value="">Todos</option>{opcoes.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}</select></CampoR03>;
  return <form className={painelR03}><div className="grid gap-4 md:grid-cols-3">
    {seletor('Ciclo', 'ciclo', ciclos.map(c => [c.id, tituloCiclo(c, cursos, periodos)]))}
    {seletor('Situação', 'situacao', estadosSolicitacao.map(s => [s, rotuloSituacao(s)]))}
    {seletor('Tutor', 'tutor', [...tutores])}{seletor('Tutorado', 'tutorado', [...tutorados])}{seletor('Proposta', 'proposta', [...propostas])}
    {usuario.perfil === 'Coordenador' && <>{seletor('Curso', 'curso', cursos.map(c => [c.id, c.denominacao]))}{seletor('Período', 'periodo', periodos.map(p => [p.id, p.identificacao]))}{seletor('Modalidade', 'modalidade', [['TCC', 'TCC'], ['IC', 'IC']])}</>}
  </div><button className="text-blue-700">Aplicar filtros</button> <a href="?" className="text-slate-500">Limpar</a></form>;
}

export function ListaSolicitacoes({ linhas, tutorId, tutoradoId }: { linhas: ReturnType<typeof consultarSolicitacoes>; tutorId?: string; tutoradoId?: string }) {
  if (!linhas.length) return <p className={painelR03}>Nenhuma solicitação encontrada.</p>;
  return <div className="space-y-4">{linhas.map(s => <article key={s.id} className={painelR03}>
    <div className="flex justify-between gap-3"><h2 className="font-semibold text-slate-800">{s.proposta?.titulo ?? 'Proposta indisponível'}</h2><SituacaoR03 valor={s.situacao}/></div>
    <p className="text-sm">{s.curso} · {s.periodo} · {s.ciclo?.modalidade} · Ciclo {s.cicloId}</p>
    <p className="whitespace-pre-wrap text-sm">{s.proposta?.resumo}</p><p className="text-xs text-slate-500">Palavras-chave: {s.proposta?.palavrasChave.join(', ') || '—'}</p>
    <p className="text-sm">Tutorado: {s.tutorado} · Preferências: {s.tutores.map(t => t.nome).join(', ')}</p>
    <p className="text-sm">Enviada em {dataR03(s.dataSolicitacao)}</p>
    {s.dataAtualizacao && <p className="text-sm">Atualizada em {dataR03(s.dataAtualizacao)}</p>}
    {s.situacao === 'Cancelada' && <p className="text-sm text-slate-600">Solicitação cancelada pelo tutorado{s.cancelamento ? ` em ${dataR03(s.cancelamento.dataCancelamento)}` : ''}. O registro permanece no histórico.</p>}
    {tutoradoId === s.tutoradoId && s.situacao === 'Pendente' && !s.decisao && <div className="space-y-3">
      {s.ciclo?.situacao === 'Aberto' && hojeInstitucional() >= s.ciclo.prazoInicio && hojeInstitucional() <= s.ciclo.prazoFim && <Link href={`/solicitacoes/${s.id}`} className="text-sm text-blue-700">Editar solicitação</Link>}
      <FormR03 action={cancelarSolicitacaoAction} rotulo="Cancelar solicitação" confirmacao="Cancelar esta solicitação? Ela será retirada da avaliação e mantida no histórico. Esta ação não pode ser desfeita."><input type="hidden" name="id" value={s.id}/></FormR03>
    </div>}
    {s.decisao && <div className="border-t border-slate-200 pt-3 text-sm"><p>Decisão: {s.decisao.resultado === 'SolicitarComplementacao' ? 'Solicitar complementação' : s.decisao.resultado} · {dataR03(s.decisao.dataDecisao)} · {s.responsavel}</p><p className="whitespace-pre-wrap">{s.decisao.justificativa || 'Sem justificativa adicional.'}</p></div>}
    {s.situacao === 'Aceita' && <p className="text-sm text-blue-800">O aceite do tutor não confirma uma alocação definitiva.</p>}
    {s.situacao === 'AguardandoComplementacao' && <p className="text-sm text-slate-600">Consulte a justificativa e combine a complementação com a coordenação. O reenvio não faz parte desta entrega.</p>}
    {tutorId && s.tutoresPreferidos.includes(tutorId) && s.situacao === 'Pendente' && !s.decisao && s.ciclo?.situacao !== 'Cancelado' && <FormR03 action={decidirSolicitacaoAction} rotulo="Registrar decisão">
      <input type="hidden" name="id" value={s.id}/><CampoR03 titulo="Decisão *"><select name="resultado" required className={campoR03}><option value="">Selecione</option><option value="Aceitar">Aceitar</option><option value="Recusar">Recusar</option><option value="SolicitarComplementacao">Solicitar complementação</option></select></CampoR03>
      <CampoR03 titulo="Justificativa (obrigatória para recusa ou complementação)"><textarea name="justificativa" maxLength={5000} rows={3} className={campoR03}/></CampoR03>
    </FormR03>}
  </article>)}</div>;
}
