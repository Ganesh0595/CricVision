

import React, { useState, useMemo } from 'react';
import { Match, Withdrawal } from '../types';
import { MATCH_FEE_PER_PLAYER } from '../constants';
import { RupeeIcon, UsersIcon, TrophyIcon, PdfIcon } from './Icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface FinanceProps {
  matches: Match[];
  withdrawals: Withdrawal[];
  onAddWithdrawal: (newWithdrawal: Omit<Withdrawal, 'id'>) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
  <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md flex items-center space-x-4 border-l-4 ${color}`}>
    <div className="p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <p className="text-slate-900 dark:text-white text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    type="button"
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

export const Finance: React.FC<FinanceProps> = ({ matches, withdrawals, onAddWithdrawal, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'withdrawal'>('summary');
  
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [personName, setPersonName] = useState('');

  const financialSummary = useMemo(() => {
    const totalCollected = matches
      .filter(m => m.status === 'Completed')
      .reduce((total, match) => {
          const fee = match.feePerPlayer ?? MATCH_FEE_PER_PLAYER;
          const paidCount = Object.values(match.fees).filter(status => status === 'Paid').length;
          return total + (paidCount * fee);
      }, 0);
    
    const totalWithdrawn = withdrawals.reduce((total, w) => total + w.amount, 0);
    const balance = totalCollected - totalWithdrawn;

    return { totalCollected, totalWithdrawn, balance };
  }, [matches, withdrawals]);

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0 || !reason || !date) {
        onShowToast('Please fill out all fields with valid values.', 'error');
        return;
    }
    
    if (numericAmount > financialSummary.balance) {
        onShowToast('Insufficient balance to withdraw.', 'error');
        return;
    }

    onAddWithdrawal({ amount: numericAmount, reason, date, personName: personName || undefined });
    setAmount('');
    setReason('');
    setPersonName('');
  };
  
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const headStyles = { fillColor: [249, 115, 22] }; // Orange-500 color

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('BCC Finance - Withdrawal Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    let startY = 40;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Financial Summary', 14, startY);
    startY += 8;
    (doc as any).autoTable({
        startY,
        theme: 'plain',
        body: [
            ['Total Fees Collected', `Rs. ${financialSummary.totalCollected.toFixed(2)}`],
            ['Total Amount Withdrawn', `Rs. ${financialSummary.totalWithdrawn.toFixed(2)}`],
            ['Current Balance', `Rs. ${financialSummary.balance.toFixed(2)}`],
        ],
        styles: { fontSize: 11, cellPadding: 2 },
        bodyStyles: { fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' } }
    });
    startY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Withdrawal History', 14, startY);
    startY += 8;
    
    const tableHead = [['Date', 'Reason', 'Person', 'Amount']];
    const tableBody = withdrawals.map(w => [
        new Date(w.date).toLocaleDateString(),
        w.reason,
        w.personName || 'N/A',
        `- Rs. ${w.amount.toFixed(2)}`
    ]);
    (doc as any).autoTable({
        startY,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles,
        columnStyles: { 3: { halign: 'right' } }
    });
    
    doc.save('BCC_Withdrawal_Report.pdf');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">BCC Finance</h2>
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav className="flex space-x-2" aria-label="Tabs">
            <TabButton isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
              Financial Summary
            </TabButton>
            <TabButton isActive={activeTab === 'withdrawal'} onClick={() => setActiveTab('withdrawal')}>
              Amount Withdrawal
            </TabButton>
          </nav>
        </div>

        {activeTab === 'summary' && (
          <div className="animate-in fade-in-0 space-y-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall Financial Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={<TrophyIcon className="h-8 w-8 text-emerald-500"/>} title="Total Fees Collected" value={`₹${financialSummary.totalCollected.toFixed(2)}`} color="border-emerald-500" />
              <StatCard icon={<RupeeIcon className="h-8 w-8 text-rose-500"/>} title="Total Amount Withdrawn" value={`₹${financialSummary.totalWithdrawn.toFixed(2)}`} color="border-rose-500" />
              <StatCard icon={<UsersIcon className="h-8 w-8 text-orange-500"/>} title="Current Balance" value={`₹${financialSummary.balance.toFixed(2)}`} color="border-orange-500" />
            </div>
          </div>
        )}

        {activeTab === 'withdrawal' && (
          <div className="animate-in fade-in-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">New Withdrawal</h3>
              <form onSubmit={handleWithdrawalSubmit} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (₹)</label>
                  <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. 500" required />
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Withdrawal</label>
                  <input type="text" id="reason" value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Bought new cricket balls" required />
                </div>
                 <div>
                  <label htmlFor="personName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Person Name (Optional)</label>
                  <input type="text" id="personName" value={personName} onChange={e => setPersonName(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Ganesh Ambhore" />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Withdrawal</label>
                  <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                </div>
                <button type="submit" className="w-full p-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all">
                  Withdrawal
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Withdrawal History</h3>
                 <button onClick={handleDownloadPDF} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md font-semibold text-sm hover:bg-emerald-700 transition-colors">
                    <PdfIcon className="h-4 w-4" />
                    <span>Download PDF</span>
                 </button>
               </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 sticky top-0">
                    <tr>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Reason</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Person</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                        <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{new Date(w.date).toLocaleDateString()}</td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">{w.reason}</td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{w.personName || 'N/A'}</td>
                        <td className="p-4 text-rose-600 dark:text-rose-400 whitespace-nowrap font-mono text-right">- ₹{w.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-8 text-slate-500">No withdrawals have been recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};