import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Vote, ShieldCheck, Award } from 'lucide-react';
import { motion } from 'framer-motion';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f1f5f9] p-4 font-sans overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px] opacity-50 z-0"></div>

      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 mb-6">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span className="text-center whitespace-normal text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] break-words">Tecnologia Eleitoral Segura</span>
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 mb-4 tracking-tight leading-none">
          Voto<span className="text-blue-600">Legal</span>
        </h1>
        <p className="text-slate-400 font-bold max-w-lg mx-auto leading-relaxed uppercase tracking-widest text-[10px] sm:text-xs">
          Simulador de Urna Eletrônica Profissional
        </p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full relative z-10">
        <motion.div
          whileHover={{ y: -10 }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/admin" className="group block">
            <div className="bg-white p-7 sm:p-10 lg:p-12 rounded-3xl sm:rounded-[48px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center transition-all group-hover:border-blue-200 group-hover:shadow-2xl">
              <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl sm:rounded-[32px] mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                <LayoutDashboard className="w-14 h-14 text-slate-400 group-hover:text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4">Administrador</h2>
              <p className="text-slate-400 font-semibold leading-relaxed">
                Crie eleições, gerencie candidatos e acompanhe os resultados em tempo real com relatórios completos.
              </p>
              <div className="mt-10 flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                Acessar Painel <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ y: -10 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/admin" className="group block">
            <div className="bg-white p-7 sm:p-10 lg:p-12 rounded-3xl sm:rounded-[48px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center transition-all group-hover:border-emerald-200 group-hover:shadow-2xl">
              <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl sm:rounded-[32px] mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 group-hover:-rotate-6">
                <Vote className="w-14 h-14 text-slate-400 group-hover:text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4">Votação</h2>
              <p className="text-slate-400 font-semibold leading-relaxed">
                Acesse a interface da urna eletrônica brasileira para registrar seu voto de forma rápida e segura.
              </p>
              <div className="mt-10 flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                Iniciar Urna <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-24 flex flex-col items-center gap-4 relative z-10"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">
          <span>Segurança</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>Transparência</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>Cidadania</span>
        </div>
        <p className="text-slate-400 text-xs font-bold">
          &copy; {new Date().getFullYear()} Voto Legal — Justiça Eleitoral Simulada
        </p>
      </motion.footer>
    </div>
  );
}

const ChevronRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default Home;
