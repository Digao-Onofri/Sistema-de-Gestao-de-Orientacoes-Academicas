import { expect, test, type Page } from '@playwright/test';

interface ModoApresentacao {
  demo?: boolean;
  manual?: boolean;
  pausaMs?: number;
}

function modo(): ModoApresentacao {
  return (test.info().project.metadata ?? {}) as ModoApresentacao;
}

let passo = 0;

/**
 * Registra no navegador a legenda exibida durante a apresentação. A legenda fica
 * guardada no sessionStorage para sobreviver às navegações entre páginas.
 * No modo manual, as teclas → ou PageDown (passadores de slide) avançam o roteiro.
 */
export async function prepararApresentacao(page: Page) {
  if (!modo().demo) return;

  await page.addInitScript(() => {
    const w = window as unknown as { __renderLegenda: () => void; __avancar: boolean };

    w.__renderLegenda = () => {
      const salva = sessionStorage.getItem('__legenda');
      if (!salva || !document.body) return;
      const { titulo, texto, dica } = JSON.parse(salva);

      let caixa = document.getElementById('__legenda');
      if (!caixa) {
        caixa = document.createElement('div');
        caixa.id = '__legenda';
        caixa.style.cssText =
          'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;' +
          'max-width:880px;width:calc(100% - 48px);padding:14px 20px;border-radius:12px;' +
          'background:rgba(15,23,42,.94);color:#f8fafc;font:16px/1.45 system-ui,sans-serif;' +
          'border:2px solid #3b82f6;' +
          'box-shadow:0 10px 30px rgba(0,0,0,.35);pointer-events:none;';
        document.body.appendChild(caixa);
      }

      caixa.replaceChildren();
      const t = document.createElement('div');
      t.style.cssText = 'font-weight:700;font-size:18px;color:#93c5fd;margin-bottom:4px;';
      t.textContent = titulo;
      const d = document.createElement('div');
      d.textContent = texto;
      caixa.append(t, d);
      if (dica) {
        const h = document.createElement('div');
        h.style.cssText = 'margin-top:8px;font-size:12px;color:#94a3b8;';
        h.textContent = dica;
        caixa.append(h);
      }
    };

    document.addEventListener('DOMContentLoaded', () => w.__renderLegenda());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') w.__avancar = true;
    });
  });
}

/**
 * Mostra o que está sendo demonstrado. No modo de testes não faz nada; nas
 * apresentações exibe a legenda e aguarda (tempo fixo ou tecla do apresentador).
 */
export async function narrar(page: Page, titulo: string, texto: string) {
  const { demo, manual, pausaMs = 3000 } = modo();
  if (!demo) return;

  passo += 1;
  const dica = manual ? 'Pressione → ou PageDown para continuar' : undefined;
  await page.evaluate(
    (legenda) => {
      const w = window as unknown as { __renderLegenda?: () => void; __avancar: boolean };
      sessionStorage.setItem('__legenda', JSON.stringify(legenda));
      w.__avancar = false;
      w.__renderLegenda?.();
    },
    { titulo: `Passo ${passo} · ${titulo}`, texto, dica }
  );

  if (manual) {
    await page.bringToFront();
    await page.waitForFunction(() => (window as unknown as { __avancar: boolean }).__avancar, null, {
      timeout: 0,
    });
  } else {
    await page.waitForTimeout(pausaMs);
  }
}

/**
 * Abre a rota e espera o React hidratar a página. Um formulário enviado antes
 * disso vira um POST nativo, sem o toast e o redirecionamento feitos pelo React.
 */
export async function abrir(page: Page, rota: string) {
  await page.goto(rota);
  await page.waitForLoadState('networkidle');
}

export async function entrar(page: Page, email: string, senha: string) {
  await abrir(page, '/login');
  await page.locator('#email').fill(email);
  await page.locator('#senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

export async function sair(page: Page) {
  await page.getByRole('button', { name: /Encerrar Sessão/ }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function esperarToast(page: Page, mensagem: string) {
  // Toasts de passos anteriores podem continuar na tela; basta um com a mensagem esperada.
  await expect(page.getByRole('status').filter({ hasText: mensagem }).first()).toBeVisible();
}
