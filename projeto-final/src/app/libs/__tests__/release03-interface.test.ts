// @vitest-environment node
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

describe('Release 03: textos da interface', () => {
  it('não exibe códigos de requisito em literais e textos visíveis', () => {
    const encontrados: string[] = [];

    function verificar(pasta: string) {
      for (const entrada of fs.readdirSync(pasta, { withFileTypes: true })) {
        const arquivo = path.join(pasta, entrada.name);
        if (entrada.isDirectory()) {
          verificar(arquivo);
          continue;
        }
        if (!/\.tsx?$/.test(arquivo) || /\.(test|spec)\./.test(arquivo)) continue;
        const fonte = ts.createSourceFile(
          arquivo,
          fs.readFileSync(arquivo, 'utf8'),
          ts.ScriptTarget.Latest,
          true,
          arquivo.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        function visitar(n: ts.Node) {
          if (
            (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n))
            && /\b(?:RF|RNF)\d+/i.test(n.text)
          ) encontrados.push(arquivo);
          ts.forEachChild(n, visitar);
        }
        visitar(fonte);
      }
    }

    verificar(path.join(process.cwd(), 'src'));
    expect(encontrados).toEqual([]);
  });
});
