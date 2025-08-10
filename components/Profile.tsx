
import React, { useState, useEffect } from 'react';
import { Player, Gender, PlayerRole } from '../types';
import { COUNTRIES, INDIAN_STATES, PLAYER_ROLES } from '../constants';
import { XIcon } from './Icons';

interface ProfileProps {
  user: Player;
  onUpdateProfile: (updatedPlayer: Player) => void;
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile, onClose }) => {
  const [formData, setFormData] = useState<Player>(user);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     const { name, value } = e.target;
     setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'jerseyNumber' ? (value === '' ? undefined : parseInt(value, 10)) : value 
    }));
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, photoUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const ProfileField: React.FC<{label: string, isEditing: boolean, children: React.ReactNode, editComponent: React.ReactNode}> = ({label, isEditing, children, editComponent}) => (
     <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {isEditing ? editComponent : <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-gray-900 dark:text-white">{children}</div>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <div className="relative max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-md">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white transition-colors" aria-label="Close Profile">
              <XIcon />
          </button>
          <div className="flex flex-col sm:flex-row-reverse items-center sm:items-start gap-6 sm:gap-8 mb-8">
            <div className="relative flex-shrink-0">
              <img src={formData.photoUrl} alt={formData.fullName} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-teal-500" />
              {isEditing && (
                <label htmlFor="photo-upload" className="absolute bottom-1 right-1 bg-teal-600 p-2 rounded-full text-white cursor-pointer hover:bg-teal-700 transition-colors" title="Change photo">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                     <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                ) : (
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{formData.fullName}</h2>
                )}
                 {isEditing ? (
                     <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                 ) : (
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{formData.email}</p>
                 )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="Role" isEditing={isEditing}
              editComponent={
                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                    {PLAYER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              }
            >
              {formData.role}
            </ProfileField>

            <ProfileField label="Jersey Number" isEditing={isEditing}
              editComponent={<input type="number" name="jerseyNumber" value={formData.jerseyNumber || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />}
            >
              {formData.jerseyNumber || 'N/A'}
            </ProfileField>

            <ProfileField label="Date of Birth" isEditing={isEditing}
              editComponent={<input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />}
            >
              {new Date(formData.dob).toLocaleDateString()}
            </ProfileField>

            <ProfileField label="Gender" isEditing={isEditing}
              editComponent={
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              }
            >
              {formData.gender}
            </ProfileField>

            <ProfileField label="Country" isEditing={isEditing}
              editComponent={
                <select name="country" value={formData.country} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              }
            >
              {formData.country}
            </ProfileField>
            
            {formData.country === 'India' ? (
                <ProfileField label="State" isEditing={isEditing}
                    editComponent={
                        <select name="state" value={formData.state} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    }
                >
                    {formData.state}
                </ProfileField>
            ) : (
                 <ProfileField label="State/Province" isEditing={isEditing}
                    editComponent={<input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />}
                >
                    {formData.state}
                </ProfileField>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              {isEditing ? (
                <>
                    <button type="button" onClick={() => { setIsEditing(false); setFormData(user); }} className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                        Save Changes
                    </button>
                </>
              ) : (
                <button type="button" onClick={() => setIsEditing(true)} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                    Edit Profile
                </button>
              )}
          </div>
        </div>
      </form>
    </div>
  );
};
