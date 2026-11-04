import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { lerR03 } from '@/app/libs/release03-store';
import { hojeInstitucional, type SolicitacaoR03 } from '@/app/libs/release03-model';
import type { CicloOrientacao, Curso, PeriodoLetivo, PropostaAcademica, Usuario } from '@/app/types';
import { tituloCiclo, painelR03 } from '@/app/components/release03-ui';
import SolicitacaoForm from '../nova/solicitacao-form';

export default async function EditarSolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioR03();
  if (!u) redirect('/login');
  if (u.perfil !== 'Tutorado') return <p>Apenas tutorados podem editar solicitações próprias.</p>;
  const { id } = await params;
  const s = lerR03<SolicitacaoR03>('solicitacoes.json').find(s => s.id === id && s.tutoradoId === u.id);
  if (!s) notFound();
  const ciclo = lerR03<CicloOrientacao>('ciclos.json').find(c => c.id === s.cicloId);
  const hoje = hojeInstitucional();
  const podeEditar = s.situacao === 'Pendente' && !s.decisao && ciclo?.situacao === 'Aberto' && ciclo.prazoInicio <= hoje && ciclo.prazoFim >= hoje;
  if (!podeEditar || !ciclo) return <div className={painelR03}><p>Esta solicitação não pode ser editada. A edição exige situação pendente, ausência de decisão e ciclo aberto dentro do prazo.</p><Link href="/solicitacoes" className="text-blue-700">Voltar às solicitações</Link></div>;
  const cursos = lerR03<Curso>('cursos.json'), periodos = lerR03<PeriodoLetivo>('periodos.json');
  const propostas = lerR03<PropostaAcademica>('propostas.json').filter(p => p.tutoradoId === u.id);
  const tutores = lerR03<Usuario>('usuarios.json').filter(t => t.perfil === 'Tutor' && t.situacao === 'Ativa').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map(({ id, nome, apresentacao, areasInteresse, tiposOrientacao, disponibilidade }) => ({ id, nome, apresentacao, areasInteresse, tiposOrientacao, disponibilidade }));
  return <div className="mx-auto max-w-2xl space-y-6"><div className="flex justify-between"><h1 className="text-2xl font-bold text-slate-800">Editar solicitação</h1><Link href="/solicitacoes" className="text-blue-600">Voltar</Link></div>
    <SolicitacaoForm ciclos={[{ ...ciclo, titulo: tituloCiclo(ciclo, cursos, periodos) }]} propostas={propostas} tutores={tutores} cicloInicial={ciclo.id} solicitacao={s}/>
  </div>;
}
