import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Users, Calendar, BarChart2, FileText, 
  Download, CheckCircle2, Trash2, Edit3, X, 
  UserPlus, Award, Info, LayoutGrid, List,
  ChevronRight, ChevronDown, UserCheck, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../components/UIProvider';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function AdminDashboard() {
  const ui = useUI();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [expandedElection, setExpandedElection] = useState(null);
  
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedElection, setSelectedElection] = useState(null);

  const [newElection, setNewElection] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'Escolar',
    candidateCount: 2
  });
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    number: '',
    party: '',
    description: ''
  });
  const [newVoter, setNewVoter] = useState({
    name: '',
    identifier: ''
  });
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/elections`);
      setElections(response.data);
    } catch (error) {
      console.error('Error fetching elections', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedElection(null);
    setPhoto(null);
    setNewCandidate({ name: '', number: '', party: '', description: '' });
    setNewVoter({ name: '', identifier: '' });
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/elections`, newElection);
      closeModal();
      fetchElections();
      ui.toast({ type: 'success', title: 'Eleição criada', message: 'A eleição foi criada com sucesso.' });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao criar eleição.' });
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newCandidate.name);
    formData.append('number', newCandidate.number);
    formData.append('party', newCandidate.party);
    formData.append('description', newCandidate.description);
    formData.append('electionId', selectedElection.id);
    if (photo) formData.append('photo', photo);

    try {
      await axios.post(`${API_URL}/candidates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      closeModal();
      fetchElections();
      ui.toast({ type: 'success', title: 'Candidato cadastrado', message: 'Candidato cadastrado com sucesso.' });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao cadastrar candidato. Verifique se o número já existe.' });
    }
  };

  const handleAddVoter = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/voters`, {
        ...newVoter,
        electionId: selectedElection.id
      });
      closeModal();
      fetchElections();
      ui.toast({ type: 'success', title: 'Eleitor cadastrado', message: 'Eleitor cadastrado com sucesso.' });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao cadastrar eleitor. Identificador já em uso.' });
    }
  };

  const handleDeleteElection = async (id) => {
    const ok = await ui.confirm({
      type: 'warning',
      title: 'Excluir eleição',
      message: 'Tem certeza que deseja excluir esta eleição?\nTodos os dados vinculados (votos, candidatos, eleitores) serão perdidos permanentemente.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/elections/${id}`);
      fetchElections();
      ui.toast({ type: 'success', title: 'Excluída', message: 'Eleição excluída com sucesso.' });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao excluir eleição.' });
    }
  };

  const handleDeleteCandidate = async (id) => {
    const ok = await ui.confirm({
      type: 'warning',
      title: 'Excluir candidato',
      message: 'Excluir este candidato?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/candidates/${id}`);
      fetchElections();
      ui.toast({ type: 'success', title: 'Excluído', message: 'Candidato excluído com sucesso.' });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao excluir candidato.' });
    }
  };

  const handleDeleteVoter = async (id) => {
    const ok = await ui.confirm({
      type: 'warning',
      title: 'Excluir eleitor',
      message: 'Excluir este eleitor?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/voters/${id}`);
      fetchElections();
      ui.toast({ type: 'success', title: 'Excluído', message: 'Eleitor excluído com sucesso.' });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao excluir eleitor.' });
    }
  };

  const downloadResults = (electionId) => {
    window.open(`${API_URL}/elections/${electionId}/export`);
  };

  const showZeresima = async (electionId) => {
    try {
      const res = await axios.get(`${API_URL}/elections/${electionId}/zeresima`);
      const data = res.data;
      await ui.alert({
        type: data.confirmedZero ? 'success' : 'warning',
        title: 'Zerésima gerada',
        message: `Eleição: ${data.electionName}\nStatus: ${data.confirmedZero ? 'SISTEMA ZERADO' : 'VOTOS DETECTADOS'}`,
        confirmText: 'Fechar',
      });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao gerar zerésima.' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-20 font-sans overflow-x-hidden">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-6 sm:flex-row sm:justify-between sm:items-center sm:h-24">
            <div className="flex items-center gap-4 min-w-0">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200 rotate-3">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">Voto Legal</h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest break-words">Sistema de Gestão Eleitoral</p>
                </div>
              </div>
            </div>
            
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
              <div className="hidden md:flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-xs ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutGrid className="w-4 h-4" /> GRADE
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-xs ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <List className="w-4 h-4" /> LISTA
                </button>
              </div>
              <button
                onClick={() => setActiveModal('createElection')}
                className="bg-slate-900 hover:bg-blue-600 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto text-xs sm:text-sm"
              >
                <Plus className="w-5 h-5" /> NOVA ELEIÇÃO
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {!loading && elections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Eleições Ativas', value: elections.length, icon: Calendar, bgClass: 'bg-blue-50', iconClass: 'text-blue-600' },
              { label: 'Candidatos', value: elections.reduce((acc, curr) => acc + curr.candidates.length, 0), icon: Award, bgClass: 'bg-amber-50', iconClass: 'text-amber-600' },
              { label: 'Eleitores', value: elections.reduce((acc, curr) => acc + curr.voters.length, 0), icon: Users, bgClass: 'bg-emerald-50', iconClass: 'text-emerald-600' },
              { label: 'Total de Votos', value: '0', icon: CheckCircle2, bgClass: 'bg-purple-50', iconClass: 'text-purple-600' },
            ].map((stat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 group hover:border-blue-100 transition-all"
              >
                <div className={`${stat.bgClass} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-7 h-7 ${stat.iconClass}`} />
                </div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h2>
              </motion.div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Carregando Ecossistema</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="bg-white rounded-[40px] p-8 sm:p-16 lg:p-24 text-center border-2 border-dashed border-slate-200 shadow-sm">
            <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12">
              <Info className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4">Seu painel está vazio</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-10 font-semibold leading-relaxed text-base sm:text-lg">Crie sua primeira eleição para começar a gerenciar candidatos e eleitores de forma profissional.</p>
            <button
              onClick={() => setActiveModal('createElection')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-black shadow-2xl shadow-blue-200 transition-all active:scale-95 w-full sm:w-auto"
            >
              CRIAR PRIMEIRA ELEIÇÃO
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-10" : "space-y-6"}>
            {elections.map((election) => (
              <motion.div 
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={election.id} 
                className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
              >
                <div className="p-6 sm:p-10">
                  <div className="flex justify-between items-start mb-8 gap-3">
                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                      <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        {election.type}
                      </span>
                      <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                        ID: {election.id.split('-')[0]}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteElection(election.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
                    >
                      <Trash2 className="w-5 h-5 group-hover:scale-110" />
                    </button>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 leading-tight break-words">{election.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-10">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {formatDate(election.startDate)} — {formatDate(election.endDate)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidatos</span>
                      </div>
                      <p className="text-3xl font-black text-slate-800">{election.candidates.length}</p>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eleitores</span>
                      </div>
                      <p className="text-3xl font-black text-slate-800">{election.voters.length}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    <button
                      onClick={() => { setSelectedElection(election); setActiveModal('addCandidate'); }}
                      className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-2xl transition-all border border-transparent hover:border-amber-100"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase">Candidato</span>
                    </button>
                    <button
                      onClick={() => { setSelectedElection(election); setActiveModal('addVoter'); }}
                      className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase">Eleitor</span>
                    </button>
                    <button
                      onClick={() => downloadResults(election.id)}
                      className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-2xl transition-all border border-transparent hover:border-emerald-100"
                    >
                      <Download className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase">Relatório</span>
                    </button>
                    <button
                      onClick={() => showZeresima(election.id)}
                      className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase">Zerésima</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <a
                      href={`/urna/${election.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-200 transition-all active:scale-95 group"
                    >
                      ABRIR URNA ELETRÔNICA
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                    
                    <button 
                      onClick={() => setExpandedElection(expandedElection === election.id ? null : election.id)}
                      className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest py-2 transition-colors"
                    >
                      {expandedElection === election.id ? (
                        <><ChevronDown className="w-4 h-4 rotate-180" /> Ocultar Detalhes</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Ver Candidatos e Eleitores</>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedElection === election.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-6 border-t border-slate-50 pt-8"
                      >
                        <div className="space-y-8">
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <Award className="w-4 h-4" /> Candidatos ({election.candidates.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {election.candidates.map(cand => (
                                <div key={cand.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-amber-100 hover:bg-white transition-all">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 border border-slate-100">
                                      {cand.number}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-800 truncate">{cand.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{cand.party}</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteCandidate(cand.id)}
                                    className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Eleitores ({election.voters.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {election.voters.map(voter => (
                                <div key={voter.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${voter.hasVoted ? 'bg-green-500' : 'bg-slate-200'}`}>
                                      {voter.hasVoted ? <UserCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-800 truncate">{voter.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {voter.identifier}</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteVoter(voter.id)}
                                    className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[48px] shadow-2xl relative z-10 w-full max-w-xl overflow-hidden border border-white/20"
            >
              <div className="px-5 sm:px-10 pt-8 sm:pt-12 pb-5 sm:pb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {activeModal === 'createElection' && 'Nova Eleição'}
                    {activeModal === 'addCandidate' && 'Registrar Candidato'}
                    {activeModal === 'addVoter' && 'Registrar Eleitor'}
                  </h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                    Preencha os campos obrigatórios
                  </p>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-4 hover:bg-slate-100 rounded-3xl transition-all hover:rotate-90"
                >
                  <X className="w-7 h-7 text-slate-400" />
                </button>
              </div>

              <div className="px-5 sm:px-10 pb-8 sm:pb-12">
                {activeModal === 'createElection' && (
                  <form onSubmit={handleCreateElection} className="space-y-6">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Eleição</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Grêmio Estudantil 2024"
                          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-black text-lg"
                          value={newElection.name}
                          onChange={(e) => setNewElection({...newElection, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Início</label>
                          <input
                            type="date"
                            required
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-bold"
                            value={newElection.startDate}
                            onChange={(e) => setNewElection({...newElection, startDate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Fim</label>
                          <input
                            type="date"
                            required
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-bold"
                            value={newElection.endDate}
                            onChange={(e) => setNewElection({...newElection, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria do Evento</label>
                        <select
                          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-black appearance-none cursor-pointer"
                          value={newElection.type}
                          onChange={(e) => setNewElection({...newElection, type: e.target.value})}
                        >
                          <option>Escolar</option>
                          <option>Sindicato</option>
                          <option>Condomínio</option>
                          <option>Geral</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-6 bg-blue-600 text-white font-black rounded-[24px] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 mt-4"
                    >
                      CONFIRMAR CRIAÇÃO
                    </button>
                  </form>
                )}

                {activeModal === 'addCandidate' && (
                  <form onSubmit={handleAddCandidate} className="space-y-6">
                    <div className="p-5 bg-amber-50 rounded-[24px] border border-amber-100 flex items-start gap-4 min-w-0">
                      <div className="bg-amber-100 p-2 rounded-xl">
                        <Award className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-amber-800 text-[10px] font-black uppercase tracking-widest break-words min-w-0">ELEIÇÃO: {selectedElection.name}</p>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-black text-lg"
                          value={newCandidate.name}
                          onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número na Urna</label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            placeholder="00"
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-black text-center text-3xl"
                            value={newCandidate.number}
                            onChange={(e) => setNewCandidate({...newCandidate, number: e.target.value.replace(/\D/g, '')})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Partido/Sigla</label>
                          <input
                            type="text"
                            required
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-black"
                            value={newCandidate.party}
                            onChange={(e) => setNewCandidate({...newCandidate, party: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto de Campanha</label>
                        <div className="relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhoto(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full p-10 border-4 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-3 group-hover:bg-slate-50 group-hover:border-blue-100 transition-all">
                            <div className="bg-slate-100 p-4 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                            </div>
                            <span className="text-slate-400 font-bold text-sm">
                              {photo ? photo.name : 'Selecionar arquivo de imagem'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-6 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-[24px] shadow-2xl shadow-slate-200 transition-all active:scale-95 mt-4"
                    >
                      SALVAR CANDIDATO
                    </button>
                  </form>
                )}

                {activeModal === 'addVoter' && (
                  <form onSubmit={handleAddVoter} className="space-y-6">
                    <div className="p-5 bg-blue-50 rounded-[24px] border border-blue-100 flex items-center gap-4">
                      <div className="bg-blue-100 p-2 rounded-xl">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-blue-800 text-[10px] font-black uppercase tracking-widest">ELEIÇÃO: {selectedElection.name}</p>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-black text-lg"
                          value={newVoter.name}
                          onChange={(e) => setNewVoter({...newVoter, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula ou Token</label>
                        <input
                          type="text"
                          required
                          placeholder="EX: 2024XXXX"
                          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 font-black text-lg"
                          value={newVoter.identifier}
                          onChange={(e) => setNewVoter({...newVoter, identifier: e.target.value})}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-6 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-[24px] shadow-2xl shadow-slate-200 transition-all active:scale-95 mt-4"
                    >
                      FINALIZAR CADASTRO
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;
