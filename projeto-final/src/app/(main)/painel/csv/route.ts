import { usuarioR03 } from '@/app/libs/release03-access';
import { consultarPainel, csvPainel } from '@/app/libs/release04-queries';

export async function GET(request: Request) {
  const usuario = await usuarioR03();
  if (!usuario) return new Response('Não autenticado.', { status: 401 });
  if (usuario.perfil !== 'Coordenador') return new Response('Acesso restrito à coordenação.', { status: 403 });
  const filtros = Object.fromEntries(new URL(request.url).searchParams);
  const linhas = await consultarPainel(usuario, filtros as any);
  return new Response(csvPainel(linhas), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="painel-gerencial.csv"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
