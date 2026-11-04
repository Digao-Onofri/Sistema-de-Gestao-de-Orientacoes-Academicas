import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { lerR03 } from '@/app/libs/release03-store';
import { salvarCicloAction } from '@/app/libs/release03-actions';
import type { CicloOrientacao, Curso, PeriodoLetivo } from '@/app/types';
import FormR03 from '@/app/components/release03-form';
import { CampoR03, campoR03, painelR03 } from '@/app/components/release03-ui';

// /ciclos/novo usa a mesma página, sem duplicar a edição.
export default async function EditarCicloPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioR03();
  if (!u) redirect('/login');
  if (u.perfil !== 'Coordenador') return <p>Acesso restrito à coordenação.</p>;
  const { id } = await params;
  const c = id === 'novo' ? undefined : lerR03<CicloOrientacao>('ciclos.json').find(c => c.id === id);
  if (id !== 'novo' && !c) notFound();
  if (c && c.situacao !== 'Rascunho') return <p>Somente rascunhos podem ser editados. <Link href="/ciclos">Voltar aos ciclos</Link></p>;
  const cursos = lerR03<Curso>('cursos.json').filter(c => c.situacao === 'Ativo'), periodos = lerR03<PeriodoLetivo>('periodos.json');
  return <div className="mx-auto max-w-2xl space-y-6"><div className="flex justify-between"><h1 className="text-2xl font-bold text-slate-800">{c ? 'Editar ciclo' : 'Novo ciclo'}</h1><Link href="/ciclos" className="text-blue-600">Voltar</Link></div>
    <p className="text-sm text-slate-600">O ciclo será salvo como rascunho. Publique e abra o ciclo na listagem para receber solicitações.</p>
    {!cursos.length || !periodos.length ? <p className={painelR03}>Cadastre um curso ativo e um período letivo antes de criar ciclos.</p> : <div className={painelR03}><FormR03 action={salvarCicloAction} destino="/ciclos" rotulo="Salvar rascunho">
      <input type="hidden" name="id" value={c?.id ?? ''}/>
      <CampoR03 titulo="Curso *"><select name="cursoId" required defaultValue={c?.cursoId ?? ''} className={campoR03}><option value="">Selecione</option>{cursos.map(c => <option key={c.id} value={c.id}>{c.denominacao}</option>)}</select></CampoR03>
      <CampoR03 titulo="Período letivo *"><select name="periodoId" required defaultValue={c?.periodoId ?? ''} className={campoR03}><option value="">Selecione</option>{periodos.map(p => <option key={p.id} value={p.id}>{p.identificacao}</option>)}</select></CampoR03>
      <CampoR03 titulo="Modalidade *"><select name="modalidade" defaultValue={c?.modalidade ?? 'TCC'} className={campoR03}><option>TCC</option><option>IC</option></select></CampoR03>
      <CampoR03 titulo="Data de início *"><input type="date" name="prazoInicio" required defaultValue={c?.prazoInicio} className={campoR03}/></CampoR03>
      <CampoR03 titulo="Data de encerramento *"><input type="date" name="prazoFim" required defaultValue={c?.prazoFim} className={campoR03}/></CampoR03>
      <CampoR03 titulo="Critérios de elegibilidade *"><textarea name="elegibilidade" required maxLength={5000} rows={4} defaultValue={c?.elegibilidade} className={campoR03}/></CampoR03>
      <CampoR03 titulo="Regras para solicitação *"><textarea name="regras" required maxLength={5000} rows={4} defaultValue={c?.regras} className={campoR03}/></CampoR03>
    </FormR03></div>}
  </div>;
}
