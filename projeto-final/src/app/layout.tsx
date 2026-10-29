import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'SGOA - Sistema de Gestão de Orientações Acadêmicas',
  description: 'Gerenciamento de Tutores, Tutorados e Orientações Acadêmicas (UNIFEI)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
