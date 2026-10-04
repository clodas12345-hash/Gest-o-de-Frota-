import React, { useState } from 'react';
import { Vehicle, TireState } from '../types';
import { 
  X, 
  Car, 
  RotateCw, 
  Plus, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  ShieldAlert, 
  Save, 
  CircleDot
} from 'lucide-react';

interface TiresManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onUpdateVehicle: (updatedVehicle: Vehicle) => void;
}

const DEFAULT_TIRES = (currentKm: number): TireState[] => [
  {
    id: 'fl',
    position: 'Frontal Esquerdo',
    brand: 'Pirelli',
    model: 'Cinturato P1',
    installedKm: Math.max(0, currentKm - 12000),
    expectedLifeKm: 45000,
    installedDate: '2025-01-10',
    twiMm: 5.5,
    status: 'Good'
  },
  {
    id: 'fr',
    position: 'Frontal Direito',
    brand: 'Pirelli',
    model: 'Cinturato P1',
    installedKm: Math.max(0, currentKm - 12000),
    expectedLifeKm: 45000,
    installedDate: '2025-01-10',
    twiMm: 5.5,
    status: 'Good'
  },
  {
    id: 'rl',
    position: 'Traseiro Esquerdo',
    brand: 'Pirelli',
    model: 'Cinturato P1',
    installedKm: Math.max(0, currentKm - 15000),
    expectedLifeKm: 45000,
    installedDate: '2024-11-05',
    twiMm: 4.8,
    status: 'Good'
  },
  {
    id: 'rr',
    position: 'Traseiro Direito',
    brand: 'Pirelli',
    model: 'Cinturato P1',
    installedKm: Math.max(0, currentKm - 15000),
    expectedLifeKm: 45000,
    installedDate: '2024-11-05',
    twiMm: 4.8,
    status: 'Good'
  },
  {
    id: 'sp',
    position: 'Estepe',
    brand: 'Pirelli',
    model: 'Cinturato P1',
    installedKm: 0,
    expectedLifeKm: 50000,
    installedDate: '2024-06-01',
    twiMm: 7.2,
    status: 'Good'
  }
];

export const TiresManagementModal: React.FC<TiresManagementModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onUpdateVehicle
}) => {
  const [tires, setTires] = useState<TireState[]>(() => {
    if (vehicle.tires && vehicle.tires.length > 0) return vehicle.tires;
    return DEFAULT_TIRES(vehicle.currentKm || 0);
  });

  const [selectedTire, setSelectedTire] = useState<TireState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const getTireByPos = (pos: TireState['position']) => {
    return tires.find(t => t.position === pos) || {
      id: pos,
      position: pos,
      brand: 'Não informado',
      installedKm: vehicle.currentKm || 0,
      expectedLifeKm: 40000,
      status: 'Good' as const,
      twiMm: 6
    };
  };

  const getTireHealth = (tire: TireState) => {
    const currentKm = vehicle.currentKm || 0;
    const drivenKm = Math.max(0, currentKm - (tire.installedKm || 0));
    const expected = tire.expectedLifeKm || 40000;
    const lifeRemainingPct = Math.max(0, Math.min(100, Math.round(((expected - drivenKm) / expected) * 100)));

    let status: 'Good' | 'Warning' | 'Replace' = 'Good';
    if (lifeRemainingPct < 25 || (tire.twiMm && tire.twiMm <= 2.0)) {
      status = 'Replace';
    } else if (lifeRemainingPct < 50 || (tire.twiMm && tire.twiMm <= 3.5)) {
      status = 'Warning';
    }

    return {
      drivenKm,
      lifeRemainingPct,
      status
    };
  };

  const handleSaveTires = (newTires: TireState[]) => {
    setTires(newTires);
    onUpdateVehicle({
      ...vehicle,
      tires: newTires
    });
    setSuccessMsg('Configuração de pneus atualizada com sucesso!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleRotateTires = () => {
    // Standard rotation: Swap front and rear in X or parallel
    const fl = getTireByPos('Frontal Esquerdo');
    const fr = getTireByPos('Frontal Direito');
    const rl = getTireByPos('Traseiro Esquerdo');
    const rr = getTireByPos('Traseiro Direito');
    const sp = getTireByPos('Estepe');

    const rotated: TireState[] = [
      { ...rl, position: 'Frontal Esquerdo', id: 'fl_rot' },
      { ...rr, position: 'Frontal Direito', id: 'fr_rot' },
      { ...fl, position: 'Traseiro Esquerdo', id: 'rl_rot' },
      { ...fr, position: 'Traseiro Direito', id: 'rr_rot' },
      sp
    ];

    handleSaveTires(rotated);
    alert('Rodízio de pneus registrado! As posições dianteiras e traseiras foram alternadas com base na quilometragem atual.');
  };

  const handleSaveTireEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTire) return;

    const updated = tires.map(t => t.position === selectedTire.position ? selectedTire : t);
    handleSaveTires(updated);
    setIsEditing(false);
    setSelectedTire(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[110] p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <CircleDot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Gestão de Pneus & Rodízio
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {vehicle.plate}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                {vehicle.brand} {vehicle.model} • Odômetro Atual: {(vehicle.currentKm || 0).toLocaleString('pt-BR')} KM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRotateTires}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-orange-900/30"
              title="Registrar rodízio de pneus entre dianteiros e traseiros"
            >
              <RotateCw className="w-4 h-4" />
              <span>Registrar Rodízio</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Visual Chassis & Tire Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 2D Chassis Display */}
            <div className="lg:col-span-7 bg-[#16161a] border border-white/10 rounded-2xl p-6 relative flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-4">
                Frente do Veículo (Direção de Rodagem) ↑
              </span>

              {/* Car Body Blueprint */}
              <div className="relative w-64 h-80 bg-black/40 border-2 border-dashed border-white/15 rounded-3xl flex flex-col justify-between p-4 my-2">
                
                {/* Front Axle */}
                <div className="flex justify-between items-center -mx-8">
                  {/* Front Left */}
                  {(() => {
                    const tire = getTireByPos('Frontal Esquerdo');
                    const health = getTireHealth(tire);
                    return (
                      <button
                        type="button"
                        onClick={() => { setSelectedTire(tire); setIsEditing(true); }}
                        className={`w-20 p-2.5 rounded-xl border text-center transition-all cursor-pointer group shadow-lg ${
                          health.status === 'Good' 
                            ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 text-emerald-300' 
                            : health.status === 'Warning'
                            ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400 text-amber-300'
                            : 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400 text-rose-300'
                        }`}
                      >
                        <span className="text-[9px] font-bold block uppercase">Diant. Esq.</span>
                        <span className="text-xs font-mono font-bold block">{health.lifeRemainingPct}%</span>
                        <span className="text-[9px] text-gray-400 truncate block">{tire.brand}</span>
                      </button>
                    );
                  })()}

                  <div className="h-1 bg-white/20 flex-1 mx-2" />

                  {/* Front Right */}
                  {(() => {
                    const tire = getTireByPos('Frontal Direito');
                    const health = getTireHealth(tire);
                    return (
                      <button
                        type="button"
                        onClick={() => { setSelectedTire(tire); setIsEditing(true); }}
                        className={`w-20 p-2.5 rounded-xl border text-center transition-all cursor-pointer group shadow-lg ${
                          health.status === 'Good' 
                            ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 text-emerald-300' 
                            : health.status === 'Warning'
                            ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400 text-amber-300'
                            : 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400 text-rose-300'
                        }`}
                      >
                        <span className="text-[9px] font-bold block uppercase">Diant. Dir.</span>
                        <span className="text-xs font-mono font-bold block">{health.lifeRemainingPct}%</span>
                        <span className="text-[9px] text-gray-400 truncate block">{tire.brand}</span>
                      </button>
                    );
                  })()}
                </div>

                {/* Car Center Logo */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <Car className="w-12 h-12 text-white/20" />
                  <span className="text-[10px] font-mono font-bold text-gray-500 mt-1">{vehicle.plate}</span>
                </div>

                {/* Rear Axle */}
                <div className="flex justify-between items-center -mx-8">
                  {/* Rear Left */}
                  {(() => {
                    const tire = getTireByPos('Traseiro Esquerdo');
                    const health = getTireHealth(tire);
                    return (
                      <button
                        type="button"
                        onClick={() => { setSelectedTire(tire); setIsEditing(true); }}
                        className={`w-20 p-2.5 rounded-xl border text-center transition-all cursor-pointer group shadow-lg ${
                          health.status === 'Good' 
                            ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 text-emerald-300' 
                            : health.status === 'Warning'
                            ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400 text-amber-300'
                            : 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400 text-rose-300'
                        }`}
                      >
                        <span className="text-[9px] font-bold block uppercase">Tras. Esq.</span>
                        <span className="text-xs font-mono font-bold block">{health.lifeRemainingPct}%</span>
                        <span className="text-[9px] text-gray-400 truncate block">{tire.brand}</span>
                      </button>
                    );
                  })()}

                  <div className="h-1 bg-white/20 flex-1 mx-2" />

                  {/* Rear Right */}
                  {(() => {
                    const tire = getTireByPos('Traseiro Direito');
                    const health = getTireHealth(tire);
                    return (
                      <button
                        type="button"
                        onClick={() => { setSelectedTire(tire); setIsEditing(true); }}
                        className={`w-20 p-2.5 rounded-xl border text-center transition-all cursor-pointer group shadow-lg ${
                          health.status === 'Good' 
                            ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400 text-emerald-300' 
                            : health.status === 'Warning'
                            ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400 text-amber-300'
                            : 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400 text-rose-300'
                        }`}
                      >
                        <span className="text-[9px] font-bold block uppercase">Tras. Dir.</span>
                        <span className="text-xs font-mono font-bold block">{health.lifeRemainingPct}%</span>
                        <span className="text-[9px] text-gray-400 truncate block">{tire.brand}</span>
                      </button>
                    );
                  })()}
                </div>

              </div>

              {/* Spare Tire (Estepe) */}
              <div className="mt-3">
                {(() => {
                  const tire = getTireByPos('Estepe');
                  const health = getTireHealth(tire);
                  return (
                    <button
                      type="button"
                      onClick={() => { setSelectedTire(tire); setIsEditing(true); }}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-black/60 hover:border-orange-500/40 text-xs font-bold text-gray-300 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <CircleDot className="w-4 h-4 text-orange-400" />
                      <span>Estepe: {tire.brand} ({health.lifeRemainingPct}% vida útil)</span>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Tire Details / Edit Card */}
            <div className="lg:col-span-5 bg-[#16161a] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
                <span>{selectedTire ? `Editar: ${selectedTire.position}` : 'Detalhes do Pneu'}</span>
                {selectedTire && (
                  <button
                    onClick={() => { setSelectedTire(null); setIsEditing(false); }}
                    className="text-[10px] text-gray-400 hover:text-white"
                  >
                    Fechar
                  </button>
                )}
              </h3>

              {selectedTire ? (
                <form onSubmit={handleSaveTireEdit} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Marca do Pneu</label>
                    <input
                      type="text"
                      value={selectedTire.brand}
                      onChange={(e) => setSelectedTire({ ...selectedTire, brand: e.target.value })}
                      placeholder="Ex: Pirelli, Goodyear, Michelin"
                      className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Modelo / Medida</label>
                    <input
                      type="text"
                      value={selectedTire.model || ''}
                      onChange={(e) => setSelectedTire({ ...selectedTire, model: e.target.value })}
                      placeholder="Ex: 185/65 R15 Cinturato P1"
                      className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">KM de Instalação</label>
                      <input
                        type="number"
                        value={selectedTire.installedKm}
                        onChange={(e) => setSelectedTire({ ...selectedTire, installedKm: Number(e.target.value) })}
                        className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Vida Estimada (KM)</label>
                      <input
                        type="number"
                        value={selectedTire.expectedLifeKm}
                        onChange={(e) => setSelectedTire({ ...selectedTire, expectedLifeKm: Number(e.target.value) })}
                        className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Sulco TWI (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedTire.twiMm || ''}
                        onChange={(e) => setSelectedTire({ ...selectedTire, twiMm: Number(e.target.value) })}
                        placeholder="Ex: 5.5"
                        className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Data da Troca</label>
                      <input
                        type="date"
                        value={selectedTire.installedDate || ''}
                        onChange={(e) => setSelectedTire({ ...selectedTire, installedDate: e.target.value })}
                        className="w-full text-xs bg-black border border-white/10 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-orange-900/20"
                  >
                    <Save className="w-4 h-4" /> Salvar Alterações no Pneu
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Clique em qualquer um dos 4 pneus ou no estepe no diagrama ao lado para visualizar a quilometragem rodada, espessura do sulco (TWI) e atualizar a marca/modelo.
                  </p>

                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Legenda de Saúde do Pneu:</span>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Verde: Pneu com boa borracha (&gt; 50% de vida útil)</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Amarelo: Pneu meia-vida (Atenção para rodízio)</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Vermelho: Pneu careca / TWI no limite (Trocar urgente)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
