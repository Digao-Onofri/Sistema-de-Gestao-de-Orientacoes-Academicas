import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { lerR03 } from '@/app/libs/release03-store';
import { consultarAlocacoesBase } from '@/app/libs/release04-queries';
import { confirmarAlocacaoAction, encerrarAlocacaoAction, cancelarAlocacaoAction } from '@/app/libs/release04-actions';
import FormR03 from '@/app/components/release03-form';
import { CampoR03 } from '@/app/components/release03-ui';
import type { CicloOrientacao, PropostaAcademica, Usuario } from '@/app/types';

export const dynamic = 'force-dynamic';

export default async function AlocacoesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const usuario = await usuarioR03();
  if (!usuario) redirect('/login');

  const params = (await searchParams) || {};
  const filtros = {
    curso: params.curso || undefined,
    ciclo: params.ciclo || undefined,
    tutor: params.tutor || undefined,
    tutorado: params.tutorado || undefined,
    situacao: params.situacao || undefined,
  };

  const alocacoes = await consultarAlocacoesBase(usuario, filtros);
  const usuarios = lerR03<Usuario>('usuarios.json');
  const tutores = usuarios.filter((u) => u.perfil === 'Tutor' && u.situacao === 'Ativa');
  const tutorados = usuarios.filter((u) => u.perfil === 'Tutorado' && u.situacao === 'Ativa');
  const propostas = lerR03<PropostaAcademica>('propostas.json');
  const ciclos = lerR03<CicloOrientacao>('ciclos.json');

  const podeConfirmar = usuario.perfil === 'Coordenador' && usuario.situacao === 'Ativa';

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Alocações de orientação</h1>
        <p className="text-sm text-slate-600">Gerencie confirmações, encerramentos e cancelamentos conforme as regras vigentes.</p>
      </header>

      {podeConfirmar ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
            <h2 className="text-lg font-medium text-slate-900">Confirmar alocação</h2>
          </div>
          <FormR03 action={confirmarAlocacaoAction}>
            <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
              <CampoR03 titulo="Tutor">
                <select name="tutorId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {tutores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </CampoR03>
              <CampoR03 titulo="Tutorado">
                <select name="tutoradoId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {tutorados.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </CampoR03>
              <CampoR03 titulo="Proposta">
                <select name="propostaId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {propostas.map((p) => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))}
                </select>
              </CampoR03>
              <CampoR03 titulo="Ciclo">
                <select name="cicloId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {ciclos.map((c) => (
                    <option key={c.id} value={c.id}>{c.id}</option>
                  ))}
                </select>
              </CampoR03>
              <CampoR03 titulo="Referência (opcional)">
                <input name="solicitacaoId" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
            </div>
            <div className="flex justify-end px-4 pb-4 sm:px-6">
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Confirmar alocação</button>
            </div>
          </FormR03>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 className="text-lg font-medium text-slate-900">Lista de alocações</h2>
          <form className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Ciclo</span>
              <select name="ciclo" defaultValue={params.ciclo || ''} className="max-w-[10rem] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm">
                <option value="">Todos</option>
                {ciclos.map((c) => (
                  <option key={c.id} value={c.id}>{c.id}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Tutor</span>
              <select name="tutor" defaultValue={params.tutor || ''} className="max-w-[10rem] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm">
                <option value="">Todos</option>
                {tutores.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Tutorado</span>
              <select name="tutorado" defaultValue={params.tutorado || ''} className="max-w-[10rem] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm">
                <option value="">Todos</option>
                {tutorados.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Situação</span>
              <select name="situacao" defaultValue={params.situacao || ''} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm">
                <option value="">Todas</option>
                <option value="Ativa">Ativa</option>
                <option value="Encerrada">Encerrada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </label>
            <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">Filtrar</button>
            <a href="?" className="py-1.5 text-sm text-slate-500 hover:text-slate-700">Limpar</a>
          </form>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Tutor</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Tutorado</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Proposta</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Ciclo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Situação</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Confirmação</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody>
              {alocacoes.map((a) => (
                <tr key={a.id} className="border-t border-slate-200">
                  <td className="px-4 py-2 sm:px-6">{a.tutorNome || a.tutorId}</td>
                  <td className="px-4 py-2 sm:px-6">{a.tutoradoNome || a.tutoradoId}</td>
                  <td className="px-4 py-2 sm:px-6">{a.propostaTitulo || a.propostaId}</td>
                  <td className="px-4 py-2 sm:px-6">{a.periodoIdentificacao || a.cicloId}</td>
                  <td className="px-4 py-2 sm:px-6">{a.situacao}</td>
                  <td className="px-4 py-2 sm:px-6">{a.dataConfirmacao?.slice(0, 10)}</td>
                  <td className="px-4 py-2 sm:px-6">
                    {podeConfirmar && a.situacao === 'Ativa' ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <FormR03 action={encerrarAlocacaoAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <input name="motivo" placeholder="Motivo" required className="rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                          <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs">Encerrar</button>
                        </FormR03>
                        <FormR03 action={cancelarAlocacaoAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <input name="motivo" placeholder="Motivo" required className="rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                          <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs">Cancelar</button>
                        </FormR03>
                      </div>
                    ) : null}
                    {(a.motivo || a.dataEncerramento || a.dataCancelamento) ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {a.motivo ? `Motivo: ${a.motivo}` : null}
                        {a.dataEncerramento ? ` • Encerrada em ${a.dataEncerramento.slice(0, 10)}` : null}
                        {a.dataCancelamento ? ` • Cancelada em ${a.dataCancelamento.slice(0, 10)}` : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {alocacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-slate-500 sm:px-6">Nenhuma alocação encontrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
