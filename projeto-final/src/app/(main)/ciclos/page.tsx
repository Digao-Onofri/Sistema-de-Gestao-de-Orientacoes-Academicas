import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { lerR03 } from '@/app/libs/release03-store';
import { mudarCicloAction } from '@/app/libs/release03-actions';
import { estadosCiclo, transicoes, hojeInstitucional } from '@/app/libs/release03-model';
import type { CicloOrientacao, Curso, PeriodoLetivo } from '@/app/types';
import FormR03 from '@/app/components/release03-form';
import { CampoR03, campoR03, painelR03, SituacaoR03, tituloCiclo, dataR03 } from '@/app/components/release03-ui';

export default async function CiclosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await usuarioR03();
  if (!u) redirect('/login');
  if (u.perfil === 'Tutor') return <p>A consulta de ciclos é destinada à coordenação e aos tutorados. Consulte suas solicitações no menu.</p>;
  const coordenador = u.perfil === 'Coordenador';
  const q = await searchParams;
  const cursos = lerR03<Curso>('cursos.json'), periodos = lerR03<PeriodoLetivo>('periodos.json');
  const ciclos = lerR03<CicloOrientacao>('ciclos.json').filter(c => (coordenador || c.situacao !== 'Rascunho') &&
    (!q.curso || c.cursoId === q.curso) && (!q.periodo || c.periodoId === q.periodo) && (!q.modalidade || c.modalidade === q.modalidade) && (!q.situacao || c.situacao === q.situacao))
    .sort((a, b) => a.prazoInicio.localeCompare(b.prazoInicio));
  return <div className="space-y-6">
    <div className="flex justify-between border-b border-slate-200 pb-4"><div><h1 className="text-2xl font-bold text-slate-800">Ciclos de orientação</h1><p className="text-sm text-slate-500">Cursos, prazos e regras para TCC e IC</p></div>{coordenador && <Link href="/ciclos/novo" className="text-blue-600">Novo ciclo</Link>}</div>
    <form className={painelR03}><div className="grid gap-4 md:grid-cols-4">
      <CampoR03 titulo="Curso"><select name="curso" defaultValue={String(q.curso ?? '')} className={campoR03}><option value="">Todos</option>{cursos.map(c => <option key={c.id} value={c.id}>{c.denominacao}</option>)}</select></CampoR03>
      <CampoR03 titulo="Período letivo"><select name="periodo" defaultValue={String(q.periodo ?? '')} className={campoR03}><option value="">Todos</option>{periodos.map(p => <option key={p.id} value={p.id}>{p.identificacao}</option>)}</select></CampoR03>
      <CampoR03 titulo="Modalidade"><select name="modalidade" defaultValue={String(q.modalidade ?? '')} className={campoR03}><option value="">Todas</option><option>TCC</option><option>IC</option></select></CampoR03>
      <CampoR03 titulo="Situação"><select name="situacao" defaultValue={String(q.situacao ?? '')} className={campoR03}><option value="">Todas</option>{estadosCiclo.filter(s => coordenador || s !== 'Rascunho').map(s => <option key={s}>{s}</option>)}</select></CampoR03>
    </div><button className="text-blue-700">Filtrar</button> <Link href="/ciclos" className="text-slate-500">Limpar</Link></form>
    {!ciclos.length && <p className={painelR03}>Nenhum ciclo encontrado para os filtros selecionados.</p>}
    {ciclos.map(c => <article className={painelR03} key={c.id}>
      <div className="flex justify-between gap-3"><h2 className="font-semibold text-slate-800">{tituloCiclo(c, cursos, periodos)}</h2><SituacaoR03 valor={c.situacao}/></div>
      <p className="text-sm">Prazo: {dataR03(c.prazoInicio)} a {dataR03(c.prazoFim)} (horário de Brasília)</p>
      {c.situacao === 'Cancelado' && <p role="status" className="text-sm text-slate-600">Ciclo cancelado. Os registros e o histórico foram preservados.</p>}
      <p className="whitespace-pre-wrap text-sm"><strong>Elegibilidade: </strong>{c.elegibilidade}</p><p className="whitespace-pre-wrap text-sm"><strong>Regras: </strong>{c.regras}</p>
      {coordenador ? <div className="space-y-3">{c.situacao === 'Rascunho' && <Link href={`/ciclos/${c.id}`} className="text-sm text-blue-700">Editar rascunho</Link>}
        {!!transicoes[c.situacao]?.length && <FormR03 action={mudarCicloAction} rotulo="Alterar situação" confirmacao="Cancelar este ciclo? Novas solicitações serão bloqueadas e o histórico será preservado. Esta ação não pode ser desfeita." confirmarQuando={{ campo: 'situacao', valor: 'Cancelado' }}><input type="hidden" name="id" value={c.id}/><CampoR03 titulo="Próxima situação"><select name="situacao" required className={campoR03}><option value="">Selecione</option>{transicoes[c.situacao].map(s => <option key={s}>{s}</option>)}</select></CampoR03></FormR03>}</div>
        : c.situacao === 'Aberto' && hojeInstitucional() >= c.prazoInicio && hojeInstitucional() <= c.prazoFim && <Link href={`/solicitacoes/nova?ciclo=${c.id}`} className="text-sm text-blue-700">Solicitar orientação</Link>}
    </article>)}
  </div>;
}
