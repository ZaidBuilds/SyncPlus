import { useEffect, useState } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, Calendar, LayoutGrid, Table2, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import DealModal from '@/components/deals/DealModal';
import PipelineSheet from '@/components/pipeline/PipelineSheet';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { key: 'proposal', label: 'Proposal', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'meeting', label: 'Meeting', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'contracted', label: 'Contracted', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'closed', label: 'Closed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'lost', label: 'Lost', color: 'bg-red-100 text-red-600 border-red-200' },
];

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [defaultStage, setDefaultStage] = useState('lead');
  const [view, setView] = useState('kanban'); // 'kanban' | 'sheet'
  const [sheetTab, setSheetTab] = useState('all'); // stage key or 'all'

  const load = () => dataClient.entities.Deal.list('-created_date', 200).then(d => { setDeals(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openNew = (stage) => { setEditDeal(null); setDefaultStage(stage || 'lead'); setModalOpen(true); };
  const openEdit = (deal) => { setEditDeal(deal); setModalOpen(true); };
  const onSave = async (data) => {
    if (editDeal) await dataClient.entities.Deal.update(editDeal.id, { ...data, last_activity_date: new Date().toISOString() });
    else await dataClient.entities.Deal.create({ ...data, last_activity_date: new Date().toISOString() });
    setModalOpen(false);
    load();
  };
  const onDelete = async () => {
    if (editDeal) await dataClient.entities.Deal.delete(editDeal.id);
    setModalOpen(false);
    load();
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Optimistic update
    const dealId = draggableId;
    const newStage = destination.droppableId;
    const deal = deals.find(d => d.id === dealId);
    
    if (deal && deal.stage !== newStage) {
      setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
      // Update real DB
      await dataClient.entities.Deal.update(dealId, { stage: newStage, last_activity_date: new Date().toISOString() });
      load(); // re-sync just in case
    }
  };

  const byStage = (stage) => deals.filter(d => d.stage === stage);
  const openValue = deals.filter(d => !['closed', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Pipeline</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {deals.length} deals · <IndianRupee size={10} />{openValue.toLocaleString('en-IN')} open value
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-1 gap-0.5">
            <button onClick={() => setView('kanban')} className={cn('p-1.5 rounded-md transition-colors', view === 'kanban' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('sheet')} className={cn('p-1.5 rounded-md transition-colors', view === 'sheet' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <Table2 size={15} />
            </button>
          </div>
          <button onClick={() => openNew('lead')} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={15} /> New Deal
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex-1 overflow-x-auto p-5">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 h-full min-w-max">
              {STAGES.map(stage => {
                const stageDeal = byStage(stage.key);
                const stageVal = stageDeal.reduce((s, d) => s + (d.value || 0), 0);
                return (
                  <div key={stage.key} className="w-64 flex flex-col">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stage.color}`}>{stage.label}</span>
                        <span className="text-xs text-muted-foreground">{stageDeal.length}</span>
                      </div>
                      {stageVal > 0 && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><IndianRupee size={9} />{stageVal.toLocaleString('en-IN')}</span>}
                    </div>
                    
                    <Droppable droppableId={stage.key}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className={cn("flex-1 bg-secondary/40 rounded-xl p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]", snapshot.isDraggingOver && "bg-secondary/60")}
                        >
                          {stageDeal.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => openEdit(deal)} 
                                  className={cn("bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow", snapshot.isDragging && "shadow-lg rotate-2 scale-105 z-50")}
                                >
                                  <p className="text-sm font-medium leading-tight">{deal.title}</p>
                                  {deal.contact_name && <p className="text-xs text-muted-foreground mt-1">{deal.contact_name}</p>}
                                  <div className="flex items-center gap-2 mt-2">
                                    {deal.value > 0 && (
                                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                        <IndianRupee size={10} />{deal.value.toLocaleString('en-IN')}
                                      </span>
                                    )}
                                    {deal.expected_close_date && (
                                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                        <Calendar size={10} />{format(new Date(deal.expected_close_date), 'MMM d')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          <button onClick={() => openNew(stage.key)} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors mt-2">
                            <Plus size={12} /> Add deal
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Sheet View */}
      {view === 'sheet' && (
        <PipelineSheet
          deals={deals}
          stages={STAGES}
          sheetTab={sheetTab}
          setSheetTab={setSheetTab}
          onEdit={openEdit}
          onNew={openNew}
        />
      )}

      {modalOpen && (
        <DealModal deal={editDeal} defaultStage={defaultStage} onSave={onSave} onDelete={onDelete} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
