import { getSession } from './session';
import { lerR03 } from './release03-store';
import type { Usuario } from '../types';

export async function usuarioR03() {
  const sessao = await getSession();
  if (!sessao) return null;
  return lerR03<Usuario>('usuarios.json').find(u => u.id === sessao.userId && u.situacao === 'Ativa' && u.perfil === sessao.perfil) ?? null;
}
