import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { lerR03 } from '@/app/libs/release03-store';
import { consultarReunioesBase } from '@/app/libs/release04-queries';
import { criarReuniaoAction } from '@/app/libs/release04-actions';
import FormR03 from '@/app/components/release03-form';
import { CampoR03 } from '@/app/components/release03-ui';
import type { AlocacaoR04 } from '@/app/libs/release04-model';

export const dynamic = 'force-dynamic';

export default async function ReunioesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const usuario = await usuarioR03();
  if (!usuario) redirect('/login');

  const params = (await searchParams) || {};
  const filtros = {
    alocacao: params.alocacao || undefined,
    de: params.de || undefined,
    ate: params.ate || undefined,
  };

  const reunioes = await consultarReunioesBase(usuario, filtros);
  const alocacoes = lerR03<AlocacaoR04>('alocacoes.json').filter((a) => {
    if (usuario.perfil === 'Coordenador') return true;
    if (usuario.perfil === 'Tutor') return a.tutorId === usuario.id && a.situacao === 'Ativa';
    return false;
  });

  const podeCriar = usuario.perfil === 'Tutor' && usuario.situacao === 'Ativa';

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Registros de reunião</h1>
        <p className="text-sm text-slate-600">Criação restrita ao tutor da alocação ativa.</p>
      </header>

      {podeCriar ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
            <h2 className="text-lg font-medium text-slate-900">Novo registro</h2>
          </div>
          <FormR03 action={criarReuniaoAction}>
            <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
              <CampoR03 titulo="Alocação">
                <select name="alocacaoId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {alocacoes.map((a) => (
                    <option key={a.id} value={a.id}>{a.id}</option>
                  ))}
                </select>
              </CampoR03>
              <CampoR03 titulo="Data da reunião">
                <input type="date" name="data" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
              <CampoR03 titulo="Próximo contato">
                <input type="date" name="proximoContato" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
              <CampoR03 titulo="Resumo">
                <input name="resumo" required maxLength={5000} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
              <CampoR03 titulo="Encaminhamentos">
                <input name="encaminhamentos" required maxLength={5000} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </CampoR03>
            </div>
            <div className="flex justify-end px-4 pb-4 sm:px-6">
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Registrar reunião</button>
            </div>
          </FormR03>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 className="text-lg font-medium text-slate-900">Lista de reuniões</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Alocação</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Data</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Resumo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Encaminhamentos</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Próximo contato</th>
              </tr>
            </thead>
            <tbody>
              {reunioes.map((r: any) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="px-4 py-2 sm:px-6">{r.alocacaoId}</td>
                  <td className="px-4 py-2 sm:px-6">{r.data}</td>
                  <td className="px-4 py-2 sm:px-6">{r.resumo}</td>
                  <td className="px-4 py-2 sm:px-6">{r.encaminhamentos}</td>
                  <td className="px-4 py-2 sm:px-6">{r.proximoContato}</td>
                </tr>
              ))}
              {reunioes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500 sm:px-6">Nenhum registro encontrado.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
