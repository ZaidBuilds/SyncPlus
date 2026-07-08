import { useState } from 'react';
import { BriefcaseBusiness, FileText, Users, Receipt, Calculator } from 'lucide-react';
import Pipeline from './Pipeline';
import Invoices from './Invoices';
import Contacts from './Contacts';
import Expenses from './Expenses';
import TaxCenter from './TaxCenter';

const TABS = [
  { id: 'pipeline', label: 'Pipeline', icon: BriefcaseBusiness },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'tax', label: 'TDS & Tax', icon: Calculator },
];

export default function BusinessHub() {
  const [activeTab, setActiveTab] = useState('pipeline');

  return (
    <div className="h-full flex flex-col -m-6 md:-m-8">
      {/* Brutalist tab bar */}
      <div className="border-b-4 border-foreground bg-background px-4 md:px-8">
        <div className="flex items-center gap-0 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-5 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-r-2 border-foreground ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        {activeTab === 'pipeline' && <Pipeline />}
        {activeTab === 'invoices' && <Invoices />}
        {activeTab === 'contacts' && <Contacts />}
        {activeTab === 'expenses' && <Expenses />}
        {activeTab === 'tax' && <TaxCenter />}
      </div>
    </div>
  );
}
