import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, ChevronLeft, ChevronRight, Sun, Moon, ArrowLeft, LogOut, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { navigationSections as initialSections } from '@/app/navigation';
import { useTheme } from '@/lib/ThemeContext';
import { CommandPalette } from './CommandPalette';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Logo } from './Logo';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Draggable sections
  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('vantage_nav_order');
    if (saved) {
      try {
        const order = JSON.parse(saved);
        return order.map(label => initialSections.find(s => s.label === label)).filter(Boolean);
      } catch { return initialSections; }
    }
    return initialSections;
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
    localStorage.setItem('vantage_nav_order', JSON.stringify(items.map(s => s.label)));
  };

  const allItems = sections.flatMap(s => s.items);
  const routeMeta = allItems.find(item => item.path === location.pathname) || {
    label: 'Monitoring Center',
    section: 'Main',
    description: '',
    icon: null
  };

  const userInitials = (user?.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(chunk => chunk[0]?.toUpperCase() || '')
    .join('');

  const canGoBack = location.pathname !== '/';

  useEffect(() => {
    if (!showUserMenu) return;
    const close = () => setShowUserMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showUserMenu]);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-border bg-background transition-all duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: collapsed ? 72 : 260 }}
      >
        <div className="flex h-full flex-col">
          <div className="p-5 flex justify-between items-center h-20 border-b border-border">
            <Logo size={24} showText={!collapsed} />
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="nav-sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {sections.map((section, index) => (
                      <Draggable key={section.label} draggableId={section.label} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            className={cn("mb-8 group/section", snapshot.isDragging && "opacity-50")}
                          >
                            {!collapsed && (
                              <div className="flex items-center justify-between px-3 py-1 mb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                  {section.label}
                                </p>
                                <div {...provided.dragHandleProps} className="opacity-0 group-hover/section:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground">
                                  <GripVertical size={12} />
                                </div>
                              </div>
                            )}
                            <div className="space-y-1">
                              {section.items.map(item => {
                                const Icon = item.icon;
                                return (
                                  <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/'}
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                      cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-sm font-bold',
                                        isActive
                                          ? 'bg-foreground text-background shadow-lg'
                                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                      )
                                    }
                                  >
                                    <Icon size={18} />
                                    {!collapsed && <span>{item.label}</span>}
                                  </NavLink>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </nav>

          {/* User Profile */}
          {!collapsed && user && (
            <div className="p-4 border-t border-border">
              <div 
                className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-muted/50 border border-border hover:bg-muted cursor-pointer transition-all" 
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-background text-sm font-black bg-foreground"
                >
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user.full_name}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{user.role || 'Solopreneur'}</p>
                </div>
              </div>
              {showUserMenu && (
                <div className="mt-2 bg-background border border-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button onClick={() => navigate('/settings')} className="w-full text-left text-[10px] font-black uppercase tracking-widest px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Settings</button>
                  <button onClick={logout} className="w-full text-left text-[10px] font-black uppercase tracking-widest px-4 py-3 text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-border">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("min-h-screen transition-all", collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]")}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl h-20">
          <div className="flex items-center justify-between px-6 h-full">
            <div className="flex items-center gap-6">
              <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-border p-2.5 lg:hidden bg-background shadow-sm hover:bg-muted transition-colors"><Menu size={20} /></button>
              {canGoBack && (
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                  <ArrowLeft size={16} /> <span>Back</span>
                </button>
              )}
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{routeMeta.section || 'Vantage'}</p>
                <h2 className="text-xl font-black tracking-tight font-heading leading-none mt-1 uppercase">{routeMeta.label || 'Monitoring Center'}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme} 
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background shadow-sm hover:bg-muted transition-all"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto"><Outlet /></main>
      </div>
      <CommandPalette />
    </div>
  );
}

export default Layout;
