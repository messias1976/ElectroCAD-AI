import type { ReactNode } from 'react';

type VisualKind = 'projects' | 'plant' | 'dimensioning' | 'ai' | 'clients' | 'subscriptions';

const visuals: Record<VisualKind, { src: string; alt: string }> = {
  projects: { src: '/assets/projects-visual.svg', alt: 'Visão visual dos projetos elétricos do ElectroCAD-AI' },
  plant: { src: '/assets/plant-visual.svg', alt: 'Planta elétrica 2D profissional do ElectroCAD-AI' },
  dimensioning: { src: '/assets/dimensioning-visual.svg', alt: 'Dimensionamento elétrico inteligente do ElectroCAD-AI' },
  ai: { src: '/assets/ai-visual.svg', alt: 'Professor ElectroCAD com inteligência artificial' },
  clients: { src: '/assets/clients-visual.svg', alt: 'Gestão de clientes do ElectroCAD-AI' },
  subscriptions: { src: '/assets/subscription-visual.svg', alt: 'Planos e assinatura do ElectroCAD-AI' },
};

export default function ProductVisual({ kind, children }: { kind: VisualKind; children?: ReactNode }) {
  const visual = visuals[kind];
  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <img src={visual.src} alt={visual.alt} className="block h-auto w-full" loading="lazy" />
      {children ? <div className="border-t border-slate-100 p-4">{children}</div> : null}
    </section>
  );
}
