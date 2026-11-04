// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import type { CicloOrientacao, Usuario, PropostaAcademica } from '../../types';
import { lerR03, gravarR03 } from '../release03-store';
import { hojeInstitucional } from '../release03-model';
import type { SolicitacaoR03 } from '../release03-model';

const { sessao } = vi.hoisted(() => ({ sessao: vi.fn() }));
vi.mock('../session', () => ({ getSession: sessao }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { salvarCicloAction, mudarCicloAction, criarSolicitacaoAction, editarSolicitacaoAction, cancelarSolicitacaoAction, decidirSolicitacaoAction } from '../release03-actions';
import { consultarSolicitacoes, csvSolicitacoes } from '../release03-queries';

let dir: string;
const usuario = (id: string, perfil: Usuario['perfil']): Usuario => ({ id, perfil, nome: id, email: `${id}@teste.invalid`, senha: 'segredo-que-nao-pode-vazar', situacao: 'Ativa', tiposOrientacao: ['TCC'] });
const usuarios = [usuario('coord', 'Coordenador'), usuario('aluno', 'Tutorado'), usuario('outro', 'Tutorado'), usuario('tutor', 'Tutor'), usuario('estranho', 'Tutor')];
const ciclo: CicloOrientacao = { id: 'ciclo', cursoId: 'curso', periodoId: 'periodo', modalidade: 'TCC', prazoInicio: '2026-01-01', prazoFim: '2099-12-31', elegibilidade: 'Matrícula ativa', regras: 'Indicar tutores', situacao: 'Aberto' };
function autenticar(id: string) { const u = usuarios.find(u => u.id === id)!; sessao.mockResolvedValue({ userId: u.id, perfil: u.perfil, email: u.email }); }
function form(campos: Record<string, string>) { const f = new FormData(); Object.entries(campos).forEach(([k, v]) => f.set(k, v)); return f; }
const solicitar = () => form({ cicloId: 'ciclo', propostaId: 'proposta', tutoresPreferidos: 'tutor', elegibilidadeDeclarada: 'on' });

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgoa-r03-test-'));
  vi.stubEnv('SGOA_DATA_DIR', dir);
  gravarR03('usuarios.json', usuarios);
  gravarR03('cursos.json', [{ id: 'curso', denominacao: 'Computação', situacao: 'Ativo' }]);
  gravarR03('periodos.json', [{ id: 'periodo', identificacao: '2026/2' }]);
  gravarR03('ciclos.json', [ciclo]);
  gravarR03('propostas.json', [{ id: 'proposta', tutoradoId: 'aluno', tipo: 'TCC', titulo: '=Proposta; com "acentuação"', resumo: 'Resumo', palavrasChave: ['pesquisa'] }]);
  gravarR03('solicitacoes.json', []);
  autenticar('aluno');
});
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); vi.unstubAllEnvs(); });

describe('Release 03 com persistência isolada', () => {
  it('cria rascunho, exige publicação antes de abrir e preserva configurações publicadas', async () => {
    autenticar('coord');
    const f = form({ ...ciclo, id: '' });
    expect(await salvarCicloAction(null, f)).toEqual({ sucesso: true });
    const novo = lerR03<CicloOrientacao>('ciclos.json')[1];
    expect(novo.situacao).toBe('Rascunho');
    expect((await mudarCicloAction(null, form({ id: novo.id, situacao: 'Aberto' })))?.erro).toBeTruthy();
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Publicado' }))).toEqual({ sucesso: true });
    expect((await salvarCicloAction(null, form({ ...ciclo, id: novo.id })))?.erro).toBeTruthy();
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Aberto' }))).toEqual({ sucesso: true });
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Encerrado' }))).toEqual({ sucesso: true });
    expect((await mudarCicloAction(null, form({ id: novo.id, situacao: 'Aberto' })))?.erro).toBeTruthy();
  });
  it('bloqueia campos inválidos e curso inativo sem escrever', async () => {
    autenticar('coord');
    for (const alteracao of [{ prazoFim: '2025-01-01' }, { prazoInicio: '2026-02-30' }, { periodoId: 'inexistente' }, { modalidade: 'Outro' }, { regras: '' }]) {
      expect((await salvarCicloAction(null, form({ ...ciclo, id: '', ...alteracao })))?.erro).toBeTruthy();
    }
    gravarR03('cursos.json', [{ id: 'curso', situacao: 'Inativo' }]);
    expect((await salvarCicloAction(null, form({ ...ciclo, id: '' })))?.erro).toBeTruthy();
    expect(lerR03('ciclos.json')).toHaveLength(1);
  });
  it.each(['coord', 'tutor', 'outro'])('impede solicitação de proposta alheia ou perfil indevido: %s', async id => {
    autenticar(id); expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy(); expect(lerR03('solicitacoes.json')).toHaveLength(0);
  });
  it.each(['Publicado', 'Encerrado', 'Cancelado', 'Rascunho'])('bloqueia ciclo %s', async situacao => {
    gravarR03('ciclos.json', [{ ...ciclo, situacao }]); expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy();
  });
  it('valida prazo, modalidade, elegibilidade, tutor ativo e preferências repetidas', async () => {
    gravarR03('ciclos.json', [{ ...ciclo, prazoFim: '2020-01-01' }]); expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy();
    gravarR03('ciclos.json', [{ ...ciclo, modalidade: 'IC' }]); expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy();
    gravarR03('ciclos.json', [ciclo]);
    for (const [chave, valor] of [['elegibilidadeDeclarada', ''], ['tutoresPreferidos', 'inexistente']]) { const f = solicitar(); f.set(chave, valor); expect((await criarSolicitacaoAction(null, f))?.erro).toBeTruthy(); }
    const f = solicitar(); f.append('tutoresPreferidos', 'tutor'); expect((await criarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    gravarR03('usuarios.json', usuarios.map(u => u.id === 'tutor' ? { ...u, situacao: 'Inativa' } : u)); expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy();
  });
  it('persiste uma solicitação, bloqueia duplicidade simultânea e preserva a proposta submetida', async () => {
    const resultados = await Promise.all([criarSolicitacaoAction(null, solicitar()), criarSolicitacaoAction(null, solicitar())]);
    expect(resultados.filter(r => r?.sucesso)).toHaveLength(1);
    gravarR03('propostas.json', [{ id: 'proposta', titulo: 'Alterada depois' }]);
    const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(s.propostaSubmetida?.titulo).toContain('acentuação');
    expect(consultarSolicitacoes(usuarios[1], {})[0].proposta?.titulo).toContain('acentuação');
  });
  it.each([['Aceitar', 'Aceita'], ['Recusar', 'Recusada'], ['SolicitarComplementacao', 'AguardandoComplementacao']])('registra %s sem criar alocação', async (resultado, situacao) => {
    await criarSolicitacaoAction(null, solicitar());
    const id = lerR03<SolicitacaoR03>('solicitacoes.json')[0].id;
    autenticar('estranho'); expect((await decidirSolicitacaoAction(null, form({ id, resultado, justificativa: 'Motivo' })))?.erro).toBeTruthy();
    autenticar('tutor');
    if (resultado !== 'Aceitar') expect((await decidirSolicitacaoAction(null, form({ id, resultado })))?.erro).toBeTruthy();
    expect(await decidirSolicitacaoAction(null, form({ id, resultado, justificativa: 'Motivo' }))).toEqual({ sucesso: true });
    const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0]; expect(s.situacao).toBe(situacao); expect(s.decisao?.tutorId).toBe('tutor'); expect(s.decisao?.dataDecisao).toBeTruthy();
    expect((await decidirSolicitacaoAction(null, form({ id, resultado, justificativa: 'Sobrescrever' })))?.erro).toBeTruthy();
    expect(fs.existsSync(path.join(dir, 'alocacoes.json'))).toBe(false);
  });
  it('aplica escopo por perfil e filtros, exportando CSV UTF-8 sem dados privados', async () => {
    await criarSolicitacaoAction(null, solicitar());
    expect(consultarSolicitacoes(usuarios[2], {})).toHaveLength(0); expect(consultarSolicitacoes(usuarios[4], {})).toHaveLength(0);
    expect(consultarSolicitacoes(usuarios[3], {})).toHaveLength(1); expect(consultarSolicitacoes(usuarios[0], { situacao: 'Aceita' })).toHaveLength(0);
    const csv = csvSolicitacoes(consultarSolicitacoes(usuarios[0], { curso: 'curso' }));
    expect(csv.charCodeAt(0)).toBe(0xfeff); expect(csv).toContain(`'=Proposta; com ""acentuação""`); expect(csv).not.toContain('segredo-que-nao-pode-vazar'); expect(csv).not.toContain('@teste.invalid');
  });
  it('bloqueia conta inativa mesmo com sessão válida e não sobrescreve JSON corrompido', async () => {
    gravarR03('usuarios.json', usuarios.map(u => u.id === 'aluno' ? { ...u, situacao: 'Inativa' } : u)); expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy();
    gravarR03('usuarios.json', usuarios); fs.writeFileSync(path.join(dir, 'solicitacoes.json'), 'corrompido');
    expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy(); expect(fs.readFileSync(path.join(dir, 'solicitacoes.json'), 'utf8')).toBe('corrompido');
  });
  it('aplica limites de dia no fuso de Brasília', () => {
    expect(hojeInstitucional(new Date('2026-11-05T02:59:59Z'))).toBe('2026-11-04');
    expect(hojeInstitucional(new Date('2026-11-05T03:00:00Z'))).toBe('2026-11-05');
  });
  it('edita proposta e tutores de uma solicitação própria sem trocar id ou data de envio', async () => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const propostas = lerR03<PropostaAcademica>('propostas.json');
    gravarR03('propostas.json', [...propostas, { ...propostas[0], id: 'segunda', titulo: 'Nova escolha' }]);
    const f = solicitar(); f.set('id', original.id); f.set('propostaId', 'segunda'); f.set('tutoresPreferidos', 'estranho');
    expect(await editarSolicitacaoAction(null, f)).toEqual({ sucesso: true });
    const editada = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(editada).toMatchObject({ id: original.id, dataSolicitacao: original.dataSolicitacao, situacao: 'Pendente', propostaId: 'segunda', tutoresPreferidos: ['estranho'] });
    expect(editada.dataAtualizacao).toBeTruthy(); expect(editada.propostaSubmetida?.titulo).toBe('Nova escolha');
    expect(consultarSolicitacoes(usuarios[3], {})).toHaveLength(0); expect(consultarSolicitacoes(usuarios[4], {})).toHaveLength(1);
  });
  it.each(['coord', 'tutor', 'outro'])('impede editar ou cancelar solicitação alheia ou por perfil indevido: %s', async ator => {
    await criarSolicitacaoAction(null, solicitar()); const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const f = solicitar(); f.set('id', s.id); autenticar(ator);
    expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy(); expect((await cancelarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0]).toEqual(s);
  });
  it.each(['Aceitar', 'Recusar', 'SolicitarComplementacao'])('bloqueia edição e cancelamento após %s', async resultado => {
    await criarSolicitacaoAction(null, solicitar()); const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    autenticar('tutor'); await decidirSolicitacaoAction(null, form({ id: s.id, resultado, justificativa: 'Decidida' }));
    const decidida = lerR03<SolicitacaoR03>('solicitacoes.json')[0]; autenticar('aluno'); const f = solicitar(); f.set('id', s.id);
    expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy(); expect((await cancelarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0]).toEqual(decidida);
  });
  it.each(['Publicado', 'Encerrado', 'Cancelado'])('impede editar em ciclo %s e permite desistência pendente preservando histórico', async situacao => {
    await criarSolicitacaoAction(null, solicitar()); const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    gravarR03('ciclos.json', [{ ...ciclo, situacao }]); const f = solicitar(); f.set('id', s.id);
    expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy(); expect((await cancelarSolicitacaoAction(null, f))?.sucesso).toBe(true);
    const cancelada = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(cancelada).toMatchObject({ ...s, situacao: 'Cancelada', cancelamento: { tutoradoId: 'aluno' } });
    expect(cancelada.cancelamento?.dataCancelamento).toBeTruthy();
  });
  it('valida na edição o prazo, o ciclo original, autoria, modalidade, tutor ativo, declaração e duplicidade', async () => {
    await criarSolicitacaoAction(null, solicitar()); const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const f = solicitar(); f.set('id', s.id);
    for (const [campo, valor] of [['cicloId', 'outro-ciclo'], ['propostaId', 'alheia'], ['tutoresPreferidos', 'inexistente'], ['elegibilidadeDeclarada', '']]) {
      const invalido = new FormData(); f.forEach((v, k) => invalido.append(k, v)); invalido.set(campo, valor);
      expect((await editarSolicitacaoAction(null, invalido))?.erro).toBeTruthy();
    }
    gravarR03('ciclos.json', [{ ...ciclo, prazoFim: '2020-01-01' }]); expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    gravarR03('ciclos.json', [{ ...ciclo, prazoInicio: '2099-01-01' }]); expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    gravarR03('ciclos.json', [ciclo]); const propostas = lerR03<PropostaAcademica>('propostas.json');
    gravarR03('propostas.json', [{ ...propostas[0], tipo: 'IC' }]); expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    gravarR03('propostas.json', propostas); gravarR03('usuarios.json', usuarios.map(u => u.id === 'tutor' ? { ...u, situacao: 'Inativa' } : u)); expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    gravarR03('usuarios.json', usuarios); gravarR03('propostas.json', [...propostas, { ...propostas[0], id: 'segunda' }]);
    const outra = solicitar(); outra.set('propostaId', 'segunda'); await criarSolicitacaoAction(null, outra); f.set('propostaId', 'segunda');
    expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy(); expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0]).toEqual(s);
  });
  it('cancela logicamente, mantém visibilidade e CSV e bloqueia decisão, reedição e duplicidade', async () => {
    await criarSolicitacaoAction(null, solicitar()); const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0]; const f = solicitar(); f.set('id', s.id);
    expect((await cancelarSolicitacaoAction(null, f))?.sucesso).toBe(true);
    expect((await cancelarSolicitacaoAction(null, f))?.erro).toBeTruthy(); expect((await editarSolicitacaoAction(null, f))?.erro).toBeTruthy();
    expect((await criarSolicitacaoAction(null, solicitar()))?.erro).toBeTruthy();
    const linhas = consultarSolicitacoes(usuarios[0], { situacao: 'Cancelada' }); expect(linhas).toHaveLength(1); expect(csvSolicitacoes(linhas)).toContain('Cancelada');
    expect(consultarSolicitacoes(usuarios[1], {})).toHaveLength(1); expect(consultarSolicitacoes(usuarios[3], {})).toHaveLength(1);
    autenticar('tutor'); expect((await decidirSolicitacaoAction(null, form({ id: s.id, resultado: 'Aceitar' })))?.erro).toBeTruthy();
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0].decisao).toBeUndefined();
  });
  it('edita e cancela registros legados sem exigir migração dos JSONs', async () => {
    const legado: SolicitacaoR03 = { id: 'legado', cicloId: 'ciclo', propostaId: 'proposta', tutoradoId: 'aluno', tutoresPreferidos: ['tutor'], situacao: 'Pendente', dataSolicitacao: '2026-01-01T12:00:00Z' };
    gravarR03('solicitacoes.json', [legado]); const f = solicitar(); f.set('id', legado.id);
    expect((await editarSolicitacaoAction(null, f))?.sucesso).toBe(true); expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0].propostaSubmetida).toBeTruthy();
    gravarR03('solicitacoes.json', [legado]); expect((await cancelarSolicitacaoAction(null, f))?.sucesso).toBe(true);
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0]).toMatchObject({ id: legado.id, dataSolicitacao: legado.dataSolicitacao, situacao: 'Cancelada' });
  });
  it('mantém decisão e cancelamento mutuamente exclusivos em chamadas concorrentes', async () => {
    await criarSolicitacaoAction(null, solicitar()); const s = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    sessao.mockResolvedValueOnce({ userId: 'aluno', perfil: 'Tutorado' }).mockResolvedValueOnce({ userId: 'tutor', perfil: 'Tutor' });
    const resultados = await Promise.all([cancelarSolicitacaoAction(null, form({ id: s.id })), decidirSolicitacaoAction(null, form({ id: s.id, resultado: 'Aceitar' }))]);
    expect(resultados.filter(r => r?.sucesso)).toHaveLength(1); const final = lerR03<SolicitacaoR03>('solicitacoes.json')[0]; expect(!!final.decisao && !!final.cancelamento).toBe(false);
  });
  it('o cancelamento do ciclo preserva solicitações vinculadas e bloqueia sua reabertura', async () => {
    await criarSolicitacaoAction(null, solicitar()); const historico = lerR03('solicitacoes.json'); autenticar('coord');
    expect((await mudarCicloAction(null, form({ id: 'ciclo', situacao: 'Cancelado' })))?.sucesso).toBe(true);
    expect(lerR03('solicitacoes.json')).toEqual(historico); expect((await mudarCicloAction(null, form({ id: 'ciclo', situacao: 'Aberto' })))?.erro).toBeTruthy();
  });
  it('não deixa códigos de requisito nos literais e textos da interface, preservando comentários técnicos', () => {
    const encontrados: string[] = [];
    function verificar(pasta: string) {
      for (const entrada of fs.readdirSync(pasta, { withFileTypes: true })) {
        const arquivo = path.join(pasta, entrada.name);
        if (entrada.isDirectory()) { verificar(arquivo); continue; }
        if (!/\.tsx?$/.test(arquivo) || /\.(test|spec)\./.test(arquivo)) continue;
        const fonte = ts.createSourceFile(arquivo, fs.readFileSync(arquivo, 'utf8'), ts.ScriptTarget.Latest, true, arquivo.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        function visitar(n: ts.Node) {
          if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n)) && /\b(?:RF|RNF)\d+/i.test(n.text)) encontrados.push(arquivo);
          ts.forEachChild(n, visitar);
        }
        visitar(fonte);
      }
    }
    verificar(path.join(process.cwd(), 'src')); expect(encontrados).toEqual([]);
  });
});
