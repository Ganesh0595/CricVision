

import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import * as XLSX from 'xlsx';
import { SearchIcon, UploadIcon } from './Icons';

interface ImportExportProps {
  players: Player[];
  onImport: (newPlayers: Player[]) => void;
  onPlayerSelect: (player: Player) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

// A robust function to parse a date from Excel/CSV and return a 'YYYY-MM-DD' string.
// Handles JS Date objects, numbers (Excel serial), and common string formats.
const parseImportedDate = (value: any): string => {
  const fallbackDate = new Date().toISOString().split('T')[0];

  if (!value) {
    return fallbackDate;
  }

  // Case 1: Value is already a JS Date object (e.g., from xlsx with cellDates:true)
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return fallbackDate;
    }
    // To prevent timezone shifts, manually construct the YYYY-MM-DD string from the date parts.
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Case 2: Value is a number (Excel serial date)
  if (typeof value === 'number') {
    // Formula to convert Excel serial number to JS Date.
    // 25569 is days between 1970-01-01 and 1900-01-01 (Excel's epoch)
    const date = new Date((value - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) {
      return fallbackDate;
    }
    // The result of this formula is a UTC date, so toISOString is safe.
    return date.toISOString().split('T')[0];
  }

  // Case 3: Value is a string
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      // It was parsed successfully. Now format it to avoid timezone issues.
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback for unhandled types or parsing failures
  console.warn(`Could not parse date value: "${value}". Defaulting to today.`);
  return fallbackDate;
};


const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
      isActive
        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
    }`}
  >
    {children}
  </button>
);


export const ImportExport: React.FC<ImportExportProps> = ({ players, onImport, onPlayerSelect, onShowToast }) => {
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'stats'>('import');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = useMemo(() => {
    return players.filter(player =>
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (!e.target?.result) throw new Error("Failed to read file.");
        
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (json.length === 0) {
            onShowToast("The imported file is empty or in an unsupported format.", 'error');
            return;
        }

        const importedPlayers: Player[] = json.map((row: any, index) => {
          if (!row.id || !row.fullName || !row.email) {
            throw new Error(`Row ${index + 2} is missing required data (id, fullName, email).`);
          }
          const jerseyNumber = row.jerseyNumber ? parseInt(String(row.jerseyNumber), 10) : undefined;
          
          return {
            ...row,
            id: String(row.id),
            fullName: String(row.fullName),
            email: String(row.email),
            dob: parseImportedDate(row.dob),
            registrationDate: parseImportedDate(row.registrationDate),
            jerseyNumber: !isNaN(jerseyNumber as any) ? jerseyNumber : undefined,
          };
        });
        
        onImport(importedPlayers);
        onShowToast(`Successfully imported/updated ${importedPlayers.length} players.`, 'success');

      } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onShowToast(`Import failed: ${errorMessage}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
       processFile(e.target.files[0]);
       // Reset file input to allow uploading the same file again
       e.target.value = '';
    }
  };

  const handleExport = () => {
    if (players.length === 0) {
      onShowToast("No player data to export.", 'error');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(players);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Players");
    XLSX.writeFile(workbook, "players_export.csv", { bookType: "csv" });
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Management</h2>
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="flex space-x-2" aria-label="Tabs">
                <TabButton isActive={activeTab === 'import'} onClick={() => setActiveTab('import')}>
                    Import Players
                </TabButton>
                <TabButton isActive={activeTab === 'export'} onClick={() => setActiveTab('export')}>
                    Export Players
                </TabButton>
                 <TabButton isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
                    Player Statistics
                </TabButton>
            </nav>
        </div>

        {activeTab === 'import' && (
            <div className="animate-in fade-in-0">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Import Player Data</h3>
                <form 
                    onDragEnter={handleDrag} 
                    onSubmit={(e) => e.preventDefault()}
                    className={`relative p-8 border-4 border-dashed rounded-xl transition-colors ${dragActive ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                >
                    <input type="file" id="file-upload" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-slate-500 dark:text-slate-400">Drag & drop your CSV or Excel file here</p>
                         <p className="text-slate-500 dark:text-slate-400 my-2">or</p>
                        <label htmlFor="file-upload" className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all cursor-pointer">
                          <UploadIcon />
                          <span>Upload File</span>
                        </label>
                    </div>
                    {dragActive && <div className="absolute inset-0" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                </form>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Only .csv and .xlsx files are supported.</p>
            </div>
        )}

        {activeTab === 'export' && (
            <div className="animate-in fade-in-0">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Export Player Data</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Export the current list of all registered players to a CSV file. This file can be edited and re-imported to update player data.</p>
                <button 
                onClick={handleExport}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                Export to CSV
                </button>
            </div>
        )}

        {activeTab === 'stats' && (
            <div className="animate-in fade-in-0">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Player Statistics</h3>
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {filteredPlayers.map(player => (
                    <li
                        key={player.id}
                        onClick={() => onPlayerSelect(player)}
                        className="flex items-center p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-200"
                    >
                        <img className="h-10 w-10 rounded-full object-cover" src={player.photoUrl} alt={player.fullName} />
                        <div className="ml-4">
                            <div className="font-semibold text-gray-900 dark:text-white">{player.fullName}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{player.role}</div>
                        </div>
                    </li>
                ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};