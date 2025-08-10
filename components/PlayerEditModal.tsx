
import React, { useState, useEffect } from 'react';
import { Player, Gender, PlayerRole } from '../types';
import { COUNTRIES, INDIAN_STATES, PLAYER_ROLES } from '../constants';
import { XIcon } from './Icons';

interface PlayerEditModalProps {
  player: Player | null;
  onUpdate: (updatedPlayer: Player) => void;
  onClose: () => void;
}

const EditField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
     <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {children}
    </div>
);

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({ player, onUpdate, onClose }) => {
  const [formData, setFormData] = useState<Player | null>(player);

  useEffect(() => {
    setFormData(player);
  }, [player]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     if (!formData) return;
     const { name, value } = e.target;
     setFormData(prev => prev ? ({ 
        ...prev, 
        [name]: name === 'jerseyNumber' ? (value === '' ? undefined : parseInt(value, 10)) : value 
    }) : null);
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && formData) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => prev ? ({ ...prev, photoUrl: event.target.result as string }) : null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
        onUpdate(formData);
    }
  };

  if (!formData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Player: {player?.fullName}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white transition-colors" aria-label="Close">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
            <div className="flex items-center space-x-4">
                <img src={formData.photoUrl} alt={formData.fullName} className="w-20 h-20 rounded-full object-cover border-2 border-orange-500" />
                <div className="flex-1">
                    <label htmlFor="photo-upload-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Update Photo</label>
                    <input id="photo-upload-edit" type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditField label="Full Name">
                    <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                </EditField>
                <EditField label="Email Address">
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                </EditField>
                <EditField label="Date of Birth">
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                </EditField>
                <EditField label="Gender">
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                        {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </EditField>
                <EditField label="Jersey Number">
                    <input type="number" name="jerseyNumber" value={formData.jerseyNumber || ''} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </EditField>
                <EditField label="Role">
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                        {PLAYER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </EditField>
                <EditField label="Country">
                    <select name="country" value={formData.country} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </EditField>
                {formData.country === 'India' ? (
                    <EditField label="State">
                        <select name="state" value={formData.state} onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </EditField>
                ) : (
                    <EditField label="State/Province">
                        <input name="state" value={formData.state} placeholder="State/Province" onChange={handleChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                    </EditField>
                )}
            </div>
            
            <div className="pt-4 mt-2 flex justify-end gap-3 flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                    Save Changes
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
