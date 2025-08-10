import React, { useState } from 'react';
import { rulesData } from './rulesData';
import { ChevronDownIcon } from './Icons';

const AccordionItem: React.FC<{
  rule: { id: string; title: string; content: React.ReactNode };
  isOpen: boolean;
  onClick: () => void;
}> = ({ rule, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <h2 id={`accordion-header-${rule.id}`}>
        <button
          type="button"
          className="flex justify-between items-center w-full p-5 font-medium text-left text-gray-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          onClick={onClick}
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${rule.id}`}
        >
          <span className="text-lg">{rule.title}</span>
          <ChevronDownIcon
            className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>
      <div
        id={`accordion-content-${rule.id}`}
        role="region"
        aria-labelledby={`accordion-header-${rule.id}`}
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[20000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          {rule.content}
        </div>
      </div>
    </div>
  );
};

export const CricketRules: React.FC = () => {
  const [openRuleId, setOpenRuleId] = useState<string | null>(rulesData[0].id);

  const handleToggle = (ruleId: string) => {
    setOpenRuleId(prevId => (prevId === ruleId ? null : ruleId));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-green-50 via-slate-50 to-blue-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900/30">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row gap-6 mb-6 items-center">
            <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Official Cricket Rules</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Based on ICC Men's Standard ODI Playing Conditions (Effective December 2023). Click on a section to expand.
                </p>
            </div>
        </div>

        <div id="cricket-rules-accordion" className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          {rulesData.map((rule) => (
            <AccordionItem
              key={rule.id}
              rule={rule}
              isOpen={openRuleId === rule.id}
              onClick={() => handleToggle(rule.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};