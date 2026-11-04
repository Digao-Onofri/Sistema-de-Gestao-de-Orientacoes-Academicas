'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CicloOrientacao, PropostaAcademica, TipoOrientacao } from '@/app/types';
import { criarSolicitacaoAction, editarSolicitacaoAction } from '@/app/libs/release03-actions';
import type { SolicitacaoR03 } from '@/app/libs/release03-model';
import FormR03 from '@/app/components/release03-form';
import { CampoR03, campoR03, painelR03, dataR03 } from '@/app/components/release03-ui';

export type TutorPublicoR03 = { id: string; nome: string; apresentacao?: string; areasInteresse?: string[]; tiposOrientacao?: TipoOrientacao[]; disponibilidade?: string };
export default function SolicitacaoForm({ ciclos, propostas, tutores, cicloInicial, solicitacao }: {
  ciclos: (CicloOrientacao & { titulo: string })[]; propostas: PropostaAcademica[]; tutores: TutorPublicoR03[]; cicloInicial: string;
  solicitacao?: SolicitacaoR03;
}) {
  const [cicloId, setCicloId] = useState(ciclos.some(c => c.id === cicloInicial) ? cicloInicial : '');
  const [area, setArea] = useState(''), [disponibilidade, setDisponibilidade] = useState('');
  const [preferencias, setPreferencias] = useState<string[]>(solicitacao?.tutoresPreferidos ?? []);
  const ciclo = ciclos.find(c => c.id === cicloId);
  const elegiveis = tutores.filter(t => !!ciclo && t.tiposOrientacao?.includes(ciclo.modalidade));
  const visiveis = elegiveis.filter(t => (!area || t.areasInteresse?.some(a => a.toLocaleLowerCase('pt-BR').includes(area.toLocaleLowerCase('pt-BR')))) &&
    (!disponibilidade || t.disponibilidade?.toLocaleLowerCase('pt-BR').includes(disponibilidade.toLocaleLowerCase('pt-BR'))));
  return <div className={painelR03}><FormR03 action={solicitacao ? editarSolicitacaoAction : criarSolicitacaoAction} destino="/solicitacoes" rotulo={solicitacao ? 'Salvar alterações' : 'Enviar solicitação'}>
    {solicitacao && <><input type="hidden" name="id" value={solicitacao.id}/><input type="hidden" name="cicloId" value={cicloId}/><p className="text-sm text-slate-500">Edite a proposta e as preferências. O ciclo e a data original de envio serão mantidos.</p></>}
    <CampoR03 titulo="Ciclo aberto *"><select name={solicitacao ? undefined : 'cicloId'} disabled={!!solicitacao} required value={cicloId} onChange={e => { setCicloId(e.target.value); setPreferencias([]); }} className={campoR03}><option value="">Selecione um ciclo</option>{ciclos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}</select></CampoR03>
    {ciclo && <div className="space-y-2 text-sm"><p>Prazo: {dataR03(ciclo.prazoInicio)} a {dataR03(ciclo.prazoFim)}</p><p className="whitespace-pre-wrap"><strong>Elegibilidade: </strong>{ciclo.elegibilidade}</p><p className="whitespace-pre-wrap"><strong>Regras: </strong>{ciclo.regras}</p></div>}
    <CampoR03 titulo="Proposta de sua autoria *"><select key={cicloId} name="propostaId" required defaultValue={solicitacao?.propostaId ?? ''} className={campoR03}><option value="">Selecione uma proposta compatível</option>{propostas.filter(p => p.tipo === ciclo?.modalidade).map(p => <option key={p.id} value={p.id}>{p.titulo} ({p.tipo})</option>)}</select></CampoR03>
    {!propostas.some(p => p.tipo === ciclo?.modalidade) && <p className="text-sm text-slate-500">Selecione um ciclo e uma proposta compatível. <Link href="/propostas/nova" className="text-blue-700">Cadastrar proposta</Link></p>}
    <fieldset className="space-y-3"><legend className="font-semibold text-slate-800">Preferências de tutores *</legend>
      <p className="text-sm text-slate-500">Selecione um ou mais tutores. As preferências não possuem ordem de prioridade nesta PoC.</p>
      <div className="grid gap-3 md:grid-cols-2"><CampoR03 titulo="Filtrar por área de interesse"><input value={area} onChange={e => setArea(e.target.value)} className={campoR03}/></CampoR03><CampoR03 titulo="Filtrar por disponibilidade divulgada"><input value={disponibilidade} onChange={e => setDisponibilidade(e.target.value)} className={campoR03}/></CampoR03></div>
      {preferencias.map(id => <input key={id} type="hidden" name="tutoresPreferidos" value={id}/>)}
      <p className="text-sm">{preferencias.length} tutor(es) selecionado(s){preferencias.length > 0 && `: ${tutores.filter(t => preferencias.includes(t.id)).map(t => t.nome).join(', ')}`}</p>
      {preferencias.length > 0 && <button type="button" onClick={() => setPreferencias([])} className="text-sm text-blue-700">Limpar preferências</button>}
      {!visiveis.length && <p className="text-sm text-slate-500">Nenhum tutor ativo encontrado para a modalidade e os filtros.</p>}
      {visiveis.map(t => <label key={t.id} className="block rounded-lg border border-slate-200 p-3 text-sm"><span className="flex gap-2"><input type="checkbox" checked={preferencias.includes(t.id)} onChange={e => setPreferencias(v => e.target.checked ? [...v, t.id] : v.filter(id => id !== t.id))}/><strong>{t.nome}</strong></span><span className="mt-2 block whitespace-pre-wrap">{t.apresentacao || 'Apresentação não informada'}</span><span className="block">Áreas: {t.areasInteresse?.join(', ') || 'Não informadas'} · Modalidades: {t.tiposOrientacao?.join(', ')}</span><span className="block">Disponibilidade: {t.disponibilidade || 'Não informada'}</span></label>)}
    </fieldset>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="elegibilidadeDeclarada" required defaultChecked={solicitacao?.elegibilidadeDeclarada}/><span>Li as regras e declaro que atendo aos critérios de elegibilidade do ciclo. A coordenação poderá conferir essa declaração.</span></label>
  </FormR03></div>;
}
