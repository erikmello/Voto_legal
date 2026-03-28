import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ShieldCheck, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useUI } from '../components/UIProvider';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || API_URL.replace(/\/api\/?$/, '');
const buildPhotoUrl = (photo) => {
  if (!photo) return null;
  const raw = String(photo);
  const p = raw.replace(/\\/g, '/');
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('//')) return `${window.location.protocol}${p}`;
  let normalized = p;
  if (normalized.includes('/uploads/')) normalized = normalized.slice(normalized.lastIndexOf('/uploads/'));
  if (normalized.includes('/src/uploads/')) normalized = `/uploads/${normalized.split('/src/uploads/').pop()}`;
  if (normalized.includes('uploads/')) normalized = `/uploads/${normalized.split('uploads/').pop()}`;
  if (!normalized.includes('/')) normalized = `/uploads/${normalized}`;
  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${API_ORIGIN}${path}`;
};
const CONFIRM_SOUND_URLS = [
  import.meta.env.VITE_URNA_CONFIRM_SOUND_URL,
  `${import.meta.env.BASE_URL}sounds/confirm.mp3`,
  `${import.meta.env.BASE_URL}sounds/confirm.mp3.mp3`,
  `${import.meta.env.BASE_URL}sounds/confirm.wav`,
  `${import.meta.env.BASE_URL}sounds/confirm.ogg`,
].filter(Boolean);

const Urna = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const ui = useUI();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterIdentifier, setVoterIdentifier] = useState('');
  const [isVoterVerified, setIsVoterVerified] = useState(false);
  const [currentNumber, setCurrentNumber] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isFinish, setIsFinish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [votoBranco, setVotoBranco] = useState(false);

  const audioContext = useRef(null);
  const confirmAudioRef = useRef(null);
  const confirmAudioUnlockedRef = useRef(false);

  useEffect(() => {
    fetchElectionData();
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    try {
      let index = 0;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.9;
      audio.src = CONFIRM_SOUND_URLS[index] || '';
      audio.addEventListener('error', () => {
        index += 1;
        if (index < CONFIRM_SOUND_URLS.length) {
          audio.src = CONFIRM_SOUND_URLS[index];
          audio.load();
        }
      });
      confirmAudioRef.current = audio;
    } catch (_) {
      confirmAudioRef.current = null;
    }
  }, [electionId]);

  const fetchElectionData = async () => {
    try {
      const eRes = await axios.get(`${API_URL}/elections/${electionId}`);
      const cRes = await axios.get(`${API_URL}/candidates/election/${electionId}`);
      setElection(eRes.data);
      setCandidates(cRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const unlockConfirmAudio = () => {
    if (confirmAudioUnlockedRef.current) return;
    const audio = confirmAudioRef.current;
    if (!audio) return;
    confirmAudioUnlockedRef.current = true;

    try {
      const oldVolume = audio.volume;
      audio.volume = 0;
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = oldVolume;
        }).catch(() => {
          audio.volume = oldVolume;
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = oldVolume;
      }
    } catch (_) {
    }
  };

  const playSound = (frequency, duration, type = 'sine') => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.current.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.current.destination);
    osc.start();
    osc.stop(audioContext.current.currentTime + duration);
  };

  const playClick = () => {
    unlockConfirmAudio();
    playSound(440, 0.1, 'square');
  };
  const playConfirma = () => {
    const audio = confirmAudioRef.current;
    if (audio) {
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        return;
      } catch (_) {
      }
    }
    playSound(440, 0.2, 'sine');
    setTimeout(() => playSound(440, 0.2, 'sine'), 200);
    setTimeout(() => playSound(440, 0.5, 'sine'), 400);
  };

  const handleVerifyVoter = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/voters/${voterIdentifier}`, {
        params: { electionId }
      });
      if (res.data.electionId !== electionId) {
        ui.toast({ type: 'error', title: 'Eleitor inválido', message: 'Este eleitor não pertence a esta eleição.' });
        return;
      }
      if (res.data.hasVoted) {
        ui.toast({ type: 'warning', title: 'Voto já registrado', message: 'Você já votou nesta eleição.' });
        return;
      }
      setIsVoterVerified(true);
      playClick();
      ui.toast({ type: 'success', title: 'Liberado', message: 'Eleitor verificado. Você já pode votar.' });
    } catch (error) {
      ui.toast({ type: 'error', title: 'Não encontrado', message: 'Identificador não encontrado ou inválido.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNumberClick = (num) => {
    if (isFinish || votoBranco) return;
    playClick();
    if (currentNumber.length < 2) {
      const newNum = currentNumber + num;
      setCurrentNumber(newNum);
      
      if (newNum.length === 2) {
        const candidate = candidates.find(c => c.number === newNum);
        setSelectedCandidate(candidate || { name: 'VOTO NULO', party: 'NULO' });
      }
    }
  };

  const handleCorrige = () => {
    playClick();
    setCurrentNumber('');
    setSelectedCandidate(null);
    setVotoBranco(false);
  };

  const handleBranco = () => {
    if (isFinish) return;
    playClick();
    setCurrentNumber('');
    setSelectedCandidate({ name: 'VOTO EM BRANCO', party: 'BRANCO' });
    setVotoBranco(true);
  };

  const handleConfirma = async () => {
    if (isFinish) return;
    if (!votoBranco && currentNumber.length < 2) return;

    setLoading(true);
    try {
      let candidateNum = votoBranco ? 'BRANCO' : currentNumber;
      if (selectedCandidate && selectedCandidate.name === 'VOTO NULO') {
        candidateNum = 'NULO';
      }

      await axios.post(`${API_URL}/voters/vote`, {
        identifier: voterIdentifier,
        electionId,
        candidateNumber: candidateNum
      });

      playConfirma();
      setIsFinish(true);
      setTimeout(() => {
        setIsVoterVerified(false);
        setIsFinish(false);
        setVoterIdentifier('');
        setCurrentNumber('');
        setSelectedCandidate(null);
        setVotoBranco(false);
      }, 3000);
    } catch (error) {
      ui.toast({ type: 'error', title: 'Erro', message: 'Erro ao confirmar voto.' });
    } finally {
      setLoading(false);
    }
  };

  if (!election) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest">Sincronizando Urna...</p>
    </div>
  );

  if (!isVoterVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f1f5f9] p-4 font-sans">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur border border-slate-200 shadow-lg shadow-slate-200 px-4 py-3 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-white transition-all font-black uppercase tracking-wider text-xs"
        >
          <ArrowLeft className="w-5 h-5" /> VOLTAR
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-7 sm:p-12 rounded-3xl sm:rounded-[40px] shadow-2xl max-w-lg w-full border border-slate-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Fingerprint className="w-32 h-32 text-blue-600" />
          </div>

          <div className="relative z-10">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-200">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 leading-tight">Portal do<br/>Eleitor</h2>
            <p className="text-slate-400 font-medium mb-10 uppercase tracking-widest text-xs">
              Eleição: <span className="text-blue-600 font-black break-words">{election.name}</span>
            </p>

            <form onSubmit={handleVerifyVoter} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Identificação do Título</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full p-4 sm:p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 focus:bg-white outline-none text-xl sm:text-2xl font-black transition-all placeholder:text-slate-200"
                  placeholder="DIGITE SUA MATRÍCULA"
                  value={voterIdentifier}
                  onChange={(e) => setVoterIdentifier(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4 sm:py-6 rounded-3xl font-black text-base sm:text-lg shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    AUTENTICAR NA URNA
                    <ShieldCheck className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
        
        <p className="mt-12 text-center break-words px-4 text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">Justiça Eleitoral • Voto Legal 2026</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#cbd5e1] p-4 urna-font">
      <div className="bg-[#dcdcdc] p-4 sm:p-8 lg:p-10 rounded-[20px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row gap-6 sm:gap-10 border-b-[12px] border-gray-400 max-w-6xl w-full border-r-4">
        
        <div className="flex-1 bg-[#c5d4c5] p-5 sm:p-8 rounded-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] border-2 border-gray-400 relative overflow-hidden min-h-[450px] flex flex-col min-w-0">
          <AnimatePresence mode='wait'>
            {isFinish ? (
              <motion.div 
                key="fim"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <h1 className="text-7xl sm:text-8xl md:text-[10rem] font-black text-gray-800 tracking-tighter leading-none">FIM</h1>
              </motion.div>
            ) : (
              <motion.div 
                key="voto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col"
              >
                <div className="mb-6">
                  <p className="text-xl font-bold border-b-2 border-gray-600 inline-block mb-1">SEU VOTO PARA</p>
                  <h2 className="text-3xl font-black tracking-widest mt-2 uppercase">Candidato</h2>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row gap-6 sm:gap-10 min-w-0">
                  <div className="flex-1 space-y-6 min-w-0">
                    <div className="flex gap-4 items-center">
                      <span className="text-lg font-bold">Número:</span>
                      <div className="flex gap-2">
                        {[0, 1].map(i => (
                          <div key={i} className="w-12 h-16 border-2 border-gray-700 flex items-center justify-center text-4xl font-black bg-white/40 shadow-inner">
                            {currentNumber[i] || ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedCandidate && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-600 uppercase">Nome:</p>
                          <p className="text-2xl font-black text-gray-800 uppercase">{selectedCandidate.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-600 uppercase">Partido:</p>
                          <p className="text-xl font-bold text-gray-800 uppercase">{selectedCandidate.party}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="w-40 h-52 bg-gray-300 border-2 border-gray-500 flex items-center justify-center overflow-hidden shadow-md">
                    {selectedCandidate && buildPhotoUrl(selectedCandidate.photo) ? (
                      <img src={buildPhotoUrl(selectedCandidate.photo)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400 text-xs font-black text-center p-4 uppercase opacity-50">Foto do<br/>Candidato</div>
                    )}
                  </div>
                </div>

                <div className="mt-auto border-t-2 border-gray-600 pt-4 text-[11px] leading-relaxed">
                  <p className="font-bold">Aperte a tecla:</p>
                  <p><span className="font-black bg-gray-800 text-white px-1 mr-1">CONFIRMA</span> para CONFIRMAR este voto</p>
                  <p><span className="font-black bg-gray-800 text-white px-1 mr-1">CORRIGE</span> para REINICIAR este voto</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {loading && !isFinish && (
            <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            </div>
          )}
        </div>

        <div className="w-full md:w-[350px] bg-[#333333] p-8 rounded-lg shadow-2xl border-t-8 border-gray-600 flex flex-col">
          <div className="text-center mb-10">
            <h1 className="text-white text-2xl font-black tracking-[0.2em] opacity-30 italic">VOTO LEGAL</h1>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button 
                key={n}
                onClick={() => handleNumberClick(n.toString())}
                className="bg-[#222] hover:bg-[#111] text-white py-5 rounded shadow-[0_5px_0_0_#000] border border-white/5 active:shadow-none active:translate-y-[5px] transition-all text-3xl font-black"
              >
                {n}
              </button>
            ))}
            <div />
            <button 
              onClick={() => handleNumberClick('0')}
              className="bg-[#222] hover:bg-[#111] text-white py-5 rounded shadow-[0_5px_0_0_#000] border border-white/5 active:shadow-none active:translate-y-[5px] transition-all text-3xl font-black"
            >
              0
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-auto">
            <button 
              onClick={handleBranco}
              className="bg-white hover:bg-gray-100 text-black py-4 px-1 rounded shadow-[0_5px_0_0_#999] active:shadow-none active:translate-y-[5px] transition-all text-[11px] font-black uppercase tracking-tighter"
            >
              Branco
            </button>
            <button 
              onClick={handleCorrige}
              className="bg-[#f06e54] hover:bg-[#d45d45] text-black py-4 px-1 rounded shadow-[0_5px_0_0_#a84d3a] active:shadow-none active:translate-y-[5px] transition-all text-[11px] font-black uppercase tracking-tighter"
            >
              Corrige
            </button>
            <button 
              onClick={handleConfirma}
              className="bg-[#47a85d] hover:bg-[#3a8a4c] text-black py-5 px-1 rounded shadow-[0_5px_0_0_#2d6a3b] active:shadow-none active:translate-y-[5px] transition-all text-sm font-black uppercase h-20"
            >
              Confirma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Urna;
