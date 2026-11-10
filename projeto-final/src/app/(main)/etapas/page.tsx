import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { lerR03 } from '@/app/libs/release03-store';
import { consultarEtapasBase, consultarAlocacoesBase } from '@/app/libs/release04-queries';
import { criarEtapaAction } from '@/app/libs/release04-actions';
import FormR03 from '@/app/components/release03-form';
import { CampoR03 } from '@/app/components/release03-ui';
import type { AlocacaoR04 } from '@/app/libs/release04-model';

export const dynamic = 'force-dynamic';

export default async function EtapasPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const usuario = await usuarioR03();
  if (!usuario) redirect('/login');

  const params = (await searchParams) || {};
  const filtros = {
    alocacao: params.alocacao || undefined,
    responsavel: params.responsavel || undefined,
    situacao: params.situacao || undefined,
  };

  const etapas = await consultarEtapasBase(usuario, filtros);
  const alocacoes = lerR03<AlocacaoR04>('alocacoes.json').filter((a) => {
    if (usuario.perfil === 'Coordenador') return true;
    if (usuario.perfil === 'Tutor') return a.tutorId === usuario.id && a.situacao === 'Ativa';
    return false;
  });

  const podeCriar = usuario.perfil === 'Tutor' && usuario.situacao === 'Ativa';

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Etapas de acompanhamento</h1>
        <p className="text-sm text-slate-600">Criação restrita ao tutor da alocação ativa.</p>
      </header>

      {podeCriar ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
            <h2 className="text-lg font-medium text-slate-900">Nova etapa</h2>
          </div>
          <FormR03 action={criarEtapaAction}>
            <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
              <CampoR03 titulo="Alocação">
                <select name="alocacaoId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {alocacoes.map((a) => (
                    <option key={a.id} value={a.id}>{a.id}</option>
                  ))}
                </select>
              </CampoR03>
              <CampoR03 titulo="Responsável">
                <input name="responsavel" required maxLength={200} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
              <CampoR03 titulo="Prazo">
                <input type="date" name="prazo" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
              <CampoR03 titulo="Situação">
                <select name="situacao" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="Pendente">Pendente</option>
                  <option value="EmAndamento">Em andamento</option>
                  <option value="Concluida">Concluída</option>
                  <option value="Atrasada">Atrasada</option>
                </select>
              </CampoR03>
              <CampoR03 titulo="Descrição">
                <input name="descricao" required maxLength={5000} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
            </div>
            <div className="flex justify-end px-4 pb-4 sm:px-6">
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Incluir etapa</button>
            </div>
          </FormR03>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 className="text-lg font-medium text-slate-900">Lista de etapas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Alocação</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Descrição</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Responsável</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Prazo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Situação</th>
              </tr>
            </thead>
            <tbody>
              {etapas.map((e: any) => (
                <tr key={e.id} className="border-t border-slate-200">
                  <td className="px-4 py-2 sm:px-6">{e.alocacaoId}</td>
                  <td className="px-4 py-2 sm:px-6">{e.descricao}</td>
                  <td className="px-4 py-2 sm:px-6">{e.responsavel}</td>
                  <td className="px-4 py-2 sm:px-6">{e.prazo}</td>
                  <td className="px-4 py-2 sm:px-6">{e.situacao}</td>
                </tr>
              ))}
              {etapas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500 sm:px-6">Nenhuma etapa encontrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
