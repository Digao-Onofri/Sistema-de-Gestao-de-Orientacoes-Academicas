import { getSession } from '@/app/libs/session';
import ConexaoBD from '@/app/libs/conexao-bd';
import type { Usuario, Curso, PeriodoLetivo, PropostaAcademica } from '@/app/types';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  const usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');
  const cursos = ConexaoBD.retornaDB<Curso>('cursos.json');
  const periodos = ConexaoBD.retornaDB<PeriodoLetivo>('periodos.json');
  const propostas = ConexaoBD.retornaDB<PropostaAcademica>('propostas.json');

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Bem-vindo ao SGOA
        </h1>
        <p className="text-sm text-slate-500">
          Painel de Gestão de Orientações Acadêmicas (TCC e Iniciação Científica | UNIFEI)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Usuários</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{usuarios.length}</p>
          <div className="mt-4">
            <Link
              href="/usuarios"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Gerenciar usuários &rarr;
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Cursos & Unidades</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{cursos.length}</p>
          <div className="mt-4">
            <Link
              href="/cursos"
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Gerenciar cursos &rarr;
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Períodos Letivos</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{periodos.length}</p>
          <div className="mt-4">
            <Link
              href="/periodos"
              className="text-xs font-semibold text-amber-600 hover:underline"
            >
              Gerenciar períodos &rarr;
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Propostas TCC / IC</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{propostas.length}</p>
          <div className="mt-4">
            <Link
              href="/propostas"
              className="text-xs font-semibold text-purple-600 hover:underline"
            >
              Gerenciar propostas &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-2">
          Módulos Implementados do DRE v1.1
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mt-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800">1. Gestão de Usuários (RF002 / RF007 / RF008 / RF009):</strong>
            <p className="mt-1 text-xs">Criação, edição, listagem com filtros e exclusão com proteção contra auto-remoção.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800">2. Cursos & Unidades (RF003 / RF010 / RF011 / RF012):</strong>
            <p className="mt-1 text-xs">Estrutura departamental, vinculação de cursos, inativação e exclusão com integridade referencial.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800">3. Períodos Letivos (RF013 / RF014):</strong>
            <p className="mt-1 text-xs">Cadastro e controle de semestres letivos (ex: 2026/1, 2026/2) para ciclos acadêmicos.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-800">4. Propostas Acadêmicas (RF005 / RF016):</strong>
            <p className="mt-1 text-xs">Cadastro de temas de pesquisa TCC e IC com título, resumo, palavras-chave e modalidade.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
