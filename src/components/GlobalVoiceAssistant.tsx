import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Cloud, GripHorizontal } from 'lucide-react';

interface GlobalVoiceAssistantProps {
  onDataExtracted: (type: 'vehicle' | 'fuel' | 'maintenance' | 'trip' | 'expense', data: any) => void;
}

export function GlobalVoiceAssistant({ onDataExtracted }: GlobalVoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('fleet_show_floating_voice_assistant') === 'true';
  });

  // Position state for dragging (null means default CSS bottom/right)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        processVoiceCommand(result);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Permissão de microfone negada. Conceda autorização nas configurações do navegador/celular.');
        } else {
          setError('Erro de áudio/microfone. Verifique as permissões do dispositivo.');
        }
        setTimeout(() => setError(''), 5000);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
       if (recognitionRef.current) {
          recognitionRef.current.abort();
       }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking close button or inner interactive buttons directly, don't initiate drag unless on drag handle or background
    isDragging.current = true;
    hasMoved.current = false;
    
    const clientX = e.clientX;
    const clientY = e.clientY;

    const currentX = pos ? pos.x : window.innerWidth - 80;
    const currentY = pos ? pos.y : window.innerHeight - 80;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMoved.current = true;
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 100, dragRef.current.initialX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.initialY + dy));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const toggleRecording = () => {
    if (hasMoved.current) return; // Ignore click if it was a drag gesture
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          setError('');
          setTranscript('');
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert('Reconhecimento de voz não suportado neste navegador.');
      }
    }
  };

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/fill-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, formType: 'auto' })
      });
      
      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Erro ao processar comando.');
      }

      const { type, data } = resData.data;
      if (['vehicle', 'fuel', 'maintenance', 'trip', 'expense'].includes(type)) {
        onDataExtracted(type as any, data);
      } else {
        setError("Comando não reconhecido. Diga por exemplo: 'Cadastrar veículo GKD Onix placa ABC1D23'.");
        setTimeout(() => setError(''), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const containerStyle: React.CSSProperties = pos ? {
    position: 'fixed',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    bottom: 'auto',
    right: 'auto',
    touchAction: 'none'
  } : {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    touchAction: 'none'
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="z-[3000] flex flex-col items-end gap-2 select-none cursor-grab active:cursor-grabbing"
      title="Arraste para mover o botão pela tela"
    >
      {/* Tooltip / Status */}
      {(isRecording || isProcessing || transcript || error) && (
        <div className="bg-blue-950/95 border border-blue-400/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs text-blue-100 max-w-[260px] animate-in slide-in-from-bottom-2">
          {error ? (
            <p className="text-rose-300 font-medium">{error}</p>
          ) : isProcessing ? (
            <div className="flex items-center gap-2 text-blue-200">
              <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
              <span>Processando voz com IA...</span>
            </div>
          ) : isRecording ? (
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>Ouvindo... Fale agora!</span>
            </div>
          ) : transcript ? (
            <p className="text-blue-200 italic">"{transcript}"</p>
          ) : null}
        </div>
      )}

      {/* Cloud Container with Blue Theme & Drag Handle */}
      <div className="relative group flex items-center bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700 text-white p-2.5 rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.4)] border border-blue-300/30 backdrop-blur-lg hover:shadow-[0_15px_40px_rgba(37,99,235,0.6)] transition-all">
        {/* Close / Remove Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            localStorage.setItem('fleet_show_floating_voice_assistant', 'false');
            setIsVisible(false);
          }}
          className="absolute -top-1 -right-1 bg-blue-900 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md transition-colors border border-blue-300/30 cursor-pointer z-10"
          title="Minimizar assistente"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Drag Indicator / Grip */}
        <div className="mr-1 text-blue-200 opacity-70 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" title="Arraste para mover">
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Cloud Voice Button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            isRecording 
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)] scale-105' 
              : 'hover:bg-blue-500/50'
          } disabled:opacity-50`}
          title="Clique para falar com o assistente em nuvem"
        >
          <Cloud className="w-5 h-5 text-blue-100 animate-pulse" />
          <span className="text-xs font-bold tracking-wide">
            {isRecording ? 'Ouvindo...' : 'IA Nuvem'}
          </span>
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

