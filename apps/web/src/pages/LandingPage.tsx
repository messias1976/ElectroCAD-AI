import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, Building2, CheckCircle2, FileText, Factory, Home, PlayCircle, ShieldCheck, Sparkles, Users, Calculator, Star, SlidersHorizontal, FileDown } from "lucide-react";
import { apiFetch } from "../services/api";

type Plan={id:string;name:string;price:string;trialDays:number;description:string;features:string[]};
const fallbackPlans:Plan[]=[
 {id:"starter",name:"Starter",price:"R$ 49",trialDays:14,description:"Para quem está começando.",features:["Projetos","Clientes","Planta 2D","IA básica"]},
 {id:"pro",name:"Pro",price:"R$ 129",trialDays:30,description:"Produtividade para profissionais.",features:["Tudo do Starter","Projetista elétrico","Professor IA","Relatórios avançados"]},
 {id:"enterprise",name:"Enterprise",price:"R$ 299",trialDays:45,description:"Recursos completos para empresas.",features:["Tudo do Pro","Maior capacidade","Recursos premium","Suporte"]},
];

const heroFeatures=[
 [ShieldCheck,"Conforme NBR 5410"],
 [Calculator,"Cálculos automáticos"],
 [SlidersHorizontal,"Diagramas unifilares"],
 [FileText,"Lista de materiais"],
 [FileDown,"Relatórios profissionais"],
];

export default function LandingPage(){
 const [heroBg,setHeroBg]=useState("/assets/electrocad-landing-bg.webp");
 const fallbackHeroBg="https://raw.githubusercontent.com/messias1976/ElectroCAD-AI/main/apps/web/public/assets/electrocad-landing-bg.webp";
 const [plans,setPlans]=useState<Plan[]>(fallbackPlans);
 useEffect(()=>{let active=true;apiFetch("/plans",{cache:"no-store"}).then(d=>{if(active&&Array.isArray(d)&&d.length)setPlans(d)}).catch(()=>undefined);return()=>{active=false}},[]);

 return <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
  {/* HEADER */}
  <header className="absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-[#061a33]/25 text-white backdrop-blur-[3px]">
   <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3.5 lg:px-9">
    <Link to="/" className="flex items-center gap-2.5">
      <span className="text-[38px] leading-none text-blue-400">⚡</span>
      <div><div className="text-[23px] font-black tracking-tight">ElectroCAD-AI</div><div className="-mt-0.5 text-[10px] tracking-wide text-slate-300">Dimensionamento Elétrico Inteligente</div></div>
    </Link>
    <nav className="hidden items-center gap-6 text-[11px] font-medium lg:flex">
      <a href="#inicio" className="border-b border-white pb-1">Início</a><a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="#integracoes">Integrações</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a>
    </nav>
    <div className="flex gap-2"><Link to="/login" className="rounded-lg border border-white/60 px-4 py-2 text-xs font-semibold">Entrar</Link><Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold shadow-lg">Criar conta</Link></div>
   </div>
  </header>

  <main>
  {/* HERO — composição visual equivalente à referência */}
  <section id="inicio" className="relative min-h-[575px] overflow-hidden bg-[#061a33] pt-24 text-white sm:min-h-[610px]">
   <img src={heroBg} onError={()=>heroBg!==fallbackHeroBg&&setHeroBg(fallbackHeroBg)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" fetchPriority="high"/>
   <div className="absolute inset-0 bg-gradient-to-r from-[#061426]/35 via-[#061a33]/10 to-transparent"/>
   <div className="relative mx-auto grid max-w-[1500px] gap-4 px-5 pb-10 pt-6 lg:grid-cols-[.98fr_1.02fr] lg:px-9">
    <div className="max-w-[650px] pt-2">
     <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/40 bg-[#082c54]/70 px-3 py-1.5 text-[9px] font-bold tracking-wide text-blue-100"><Sparkles size={12}/> IA ESPECIALIZADA EM NBR 5410</div>
     <h1 className="mt-4 text-[38px] font-black leading-[.98] tracking-tight sm:text-5xl lg:text-[53px]">Dimensione instalações elétricas com <span className="text-blue-400">Inteligência Artificial</span></h1>
     <p className="mt-4 max-w-[600px] text-[13px] leading-5 text-slate-200 sm:text-[15px]">Crie projetos elétricos completos, com diagramas, listas de materiais e relatórios profissionais, de acordo com a <b className="text-white">NBR 5410</b>. Mais segurança, rapidez e precisão para engenheiros, eletricistas e projetistas.</p>
     <div className="mt-5 flex flex-wrap gap-2.5"><Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold shadow-xl">Começar agora <ArrowRight size={15}/></Link><a href="#como-funciona" className="inline-flex items-center gap-2 rounded-lg border border-white/60 px-5 py-3 text-xs font-semibold"><PlayCircle size={15}/> Ver demonstração</a></div>
     <div className="mt-6 grid grid-cols-5 gap-2">{heroFeatures.map(([Icon,title]:any)=><div key={title} className="min-w-0 text-center sm:text-left"><div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 sm:mx-0"><Icon size={15}/></div><div className="text-[8px] font-semibold leading-3 text-slate-200 sm:text-[9px]">{title}</div></div>)}</div>
    </div>
    <div className="relative hidden min-h-[430px] lg:block">
      <div className="absolute right-0 top-7 w-[88%] overflow-hidden rounded-[25px] border border-white/20 bg-slate-950/35 p-2.5 shadow-2xl"><img src="/assets/plant-visual.svg" alt="Planta elétrica" className="w-full rounded-2xl"/></div>
      <div className="absolute right-1 top-0 w-44 rounded-xl bg-white p-3 text-slate-900 shadow-2xl"><div className="flex items-center gap-2"><span className="text-2xl text-blue-600">⚡</span><div><b className="block text-[10px]">Projeto Residencial</b><b className="block text-sm">2 Quartos</b><span className="text-[8px] text-slate-500">127/220V · Conforme NBR 5410</span></div></div></div>
      <div className="absolute right-0 top-32 w-36 rounded-xl bg-white p-3 text-slate-800 shadow-xl"><div className="space-y-1.5 text-[9px]"><div>🔵 Diagramas</div><div>🔵 Memoriais</div><div>🔵 Lista de materiais</div><div>🔵 Relatório em PDF</div></div></div>
      <div className="absolute bottom-2 left-0 rounded-xl bg-white p-3 text-slate-900 shadow-2xl"><div className="flex items-center gap-2 text-[11px] font-bold"><Bot className="text-blue-600" size={20}/> Com Inteligência Artificial</div><div className="mt-1.5 space-y-1 text-[9px]"><div>✓ Sugestões inteligentes</div><div>✓ Validação da norma</div><div>✓ Projetos mais rápidos</div></div></div>
    </div>
   </div>
  </section>

  {/* CATEGORIAS */}
  <section id="recursos" className="border-b bg-white">
   <div className="mx-auto grid max-w-[1500px] grid-cols-2 divide-x px-4 py-4 sm:grid-cols-4 lg:px-8">
    {[
      [Home,"Residencial","Casas, apartamentos e condomínios."],
      [Building2,"Comercial","Lojas, escritórios e pequenos comércios."],
      [Factory,"Industrial","Galpões, indústrias e instalações especiais."],
      [FileText,"Memoriais e Relatórios","Exportação profissional em PDF."]
    ].map(([Icon,title,text]:any)=><div key={title} className="px-3 py-2 text-center"><Icon className="mx-auto text-blue-600" size={30}/><h3 className="mt-1 text-sm font-bold">{title}</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">{text}</p></div>)}
   </div>
  </section>

  {/* IA */}
  <section id="sobre" className="bg-[#061a33] text-white">
   <div className="mx-auto grid max-w-[1500px] items-center gap-4 px-5 py-7 lg:grid-cols-[.92fr_1.08fr] lg:px-9">
    <div className="flex items-center gap-5"><div className="hidden shrink-0 sm:block"><img src="/assets/ai-visual.svg" alt="" className="h-32 w-44 object-cover object-left rounded-2xl"/></div><div><h2 className="text-2xl font-black leading-tight sm:text-3xl">Sua IA especializada<br/>em instalações elétricas</h2><p className="mt-2 max-w-md text-[11px] leading-4 text-slate-300">Obtenha dimensionamento, recomendações e validações de acordo com a NBR 5410 em poucos segundos.</p><Link to="/professor" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[10px] font-bold">Conheça a IA <ArrowRight size={13}/></Link></div></div>
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-blue-300/20 bg-white/5 p-3 text-[10px] sm:grid-cols-3">{["Dimensionamento automático","Validação NBR 5410","Sugestões de disjuntores e cabos","Diagramas unifilares e multifilares","Lista de materiais completa","Alertas e dados faltantes"].map(x=><div key={x} className="rounded-lg bg-white/5 p-2.5"><CheckCircle2 className="mr-1 inline text-blue-400" size={13}/>{x}</div>)}</div>
   </div>
  </section>

  {/* COMO FUNCIONA */}
  <section id="como-funciona" className="bg-[#f4f8fc] py-6">
   <div className="mx-auto max-w-[1300px] px-5 text-center"><h2 className="text-2xl font-black text-[#0b1940]">Como funciona?</h2><p className="text-[11px] text-slate-500">Do seu projeto ao relatório completo em 4 passos simples.</p>
    <div className="mt-5 grid gap-2 sm:grid-cols-4">{[
      ["1","Informe os Dados","Tipo de projeto, ambientes e carga instalada.",FileText],
      ["2","A IA Processa","Dimensiona conforme a NBR 5410.",Calculator],
      ["3","Revise e Ajuste","Faça alterações se necessário.",SlidersHorizontal],
      ["4","Exporte o Projeto","Obtenha diagramas, memoriais e lista de materiais.",FileDown]
    ].map(([n,t,d,Icon]:any)=><div key={n} className="relative rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{n}</span><b className="text-[11px] text-[#0b1940]">{t}</b></div><div className="mt-2 flex items-center gap-2"><Icon className="text-blue-600" size={21}/><p className="text-[9px] leading-3.5 text-slate-500">{d}</p></div></div>)}</div>
   </div>
  </section>

  {/* PROVA SOCIAL / RODAPÉ VISUAL */}
  <section className="relative overflow-hidden bg-[#071c36] text-white">
   <div className="absolute inset-0 opacity-30"><img src={heroBg} onError={()=>heroBg!==fallbackHeroBg&&setHeroBg(fallbackHeroBg)} alt="" className="h-full w-full object-cover" loading="lazy"/></div>
   <div className="relative mx-auto grid max-w-[1300px] grid-cols-2 gap-3 px-5 py-6 sm:grid-cols-4">
    {[[Users,"+500","Projetos criados"],[Users,"+300","Profissionais"],[ShieldCheck,"99%","Conforme NBR 5410"],[Star,"4.9","Avaliação dos usuários"]].map(([Icon,n,t]:any)=><div key={t} className="flex items-center justify-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5"><Icon size={18}/></span><div><b className="block text-lg">{n}</b><span className="text-[9px] text-slate-300">{t}</span></div></div>)}
   </div>
  </section>

  {/* planos, abaixo da área de referência */}
  <section id="planos" className="bg-white py-14"><div className="mx-auto max-w-[1200px] px-5"><div className="text-center"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Planos</p><h2 className="mt-2 text-3xl font-black">Escolha o plano ideal</h2></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{plans.map(p=><article key={p.id} className={`relative flex flex-col rounded-3xl border p-6 ${p.name.toLowerCase()==="pro"?"border-blue-500 bg-blue-50/30 shadow-xl":"border-slate-200 shadow-sm"}`}><h3 className="text-xl font-bold">{p.name}</h3><p className="mt-2 min-h-12 text-sm text-slate-500">{p.description}</p><div className="mt-4 text-3xl font-black">{p.price}<span className="text-xs font-normal text-slate-500">/mês</span></div><ul className="mt-5 flex-1 space-y-2 text-sm text-slate-600">{p.features.map(x=><li key={x}><CheckCircle2 className="mr-2 inline text-blue-600" size={15}/>{x}</li>)}</ul><Link to="/register" className="mt-5 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white">Começar com {p.name}</Link></article>)}</div></div></section>

  <section id="integracoes" className="bg-slate-50 py-10"><div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-3 px-5 sm:grid-cols-4">{[[Calculator,"Projetista"],[Bot,"Professor IA"],[FileText,"Relatórios PDF"],[Users,"Gestão de clientes"]].map(([Icon,t]:any)=><div key={t} className="rounded-2xl border bg-white p-5 text-center shadow-sm"><Icon className="mx-auto text-blue-600"/><b className="mt-2 block text-sm">{t}</b></div>)}</div></section>
  </main>
 <footer id="contato" className="border-t bg-white"><div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} ElectroCAD-AI</span><span>Projetos elétricos com mais organização, tecnologia e segurança.</span></div></footer>
 </div>;
}