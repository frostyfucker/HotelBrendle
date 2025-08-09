
import React, { useState } from 'react';
import { View } from '../types';
import { LayoutDashboard, Lightbulb, PiggyBank, Wrench, Activity, Sparkles, MapPin, Info, ChevronDown, Clock, Archive, Bot, LogOut } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onOpenAbout: () => void;
}

const NavLink: React.FC<{
  id: View;
  label: string;
  icon: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  colorClass: string;
}> = ({ id, label, icon, activeView, setActiveView, colorClass }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setActiveView(id);
      }}
      className={`flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
        activeView === id
          ? 'bg-brand-primary-600 text-white shadow-md'
          : `text-slate-500 dark:text-slate-400 hover:bg-brand-primary-50 dark:hover:bg-slate-700/50 hover:text-brand-primary-600 dark:hover:text-white`
      }`}
    >
      <span className={colorClass}>{icon}</span>
      <span className="font-medium">{label}</span>
    </a>
  </li>
);

const NavCategory: React.FC<{
  label: string;
  emoji: string;
  children: React.ReactNode;
}> = ({ label, emoji, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-bold uppercase text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md">
                <span>{emoji} {label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <ul className="mt-1 space-y-1">{children}</ul>}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenAbout }) => {
  const { user, logout } = useAuth();
  if (!user) return null; // Should not happen if App component logic is correct
  const currentUserRole = user.role;

  const operationsViews = (
     <NavCategory label="Operations" emoji="🏨">
      <NavLink id="dashboard" label="Dashboard" icon={<LayoutDashboard className="w-5 h-5"/>} colorClass="text-sky-500" {...{activeView, setActiveView}} />
      <NavLink id="hotel-pulse" label="Hotel Pulse" icon={<Activity className="w-5 h-5"/>} colorClass="text-red-500" {...{activeView, setActiveView}} />
      <NavLink id="maintenance-repair" label="Maintenance" icon={<Wrench className="w-5 h-5"/>} colorClass="text-orange-500" {...{activeView, setActiveView}} />
      {currentUserRole === 'staff' && <NavLink id="time-clock" label="Time Clock" icon={<Clock className="w-5 h-5"/>} colorClass="text-indigo-500" {...{activeView, setActiveView}} />}
    </NavCategory>
  );

  const managementViews = (
    <NavCategory label="Management" emoji="💼">
        <NavLink id="budget-tracker" label="Budget Tracker" icon={<PiggyBank className="w-5 h-5"/>} colorClass="text-green-500" {...{activeView, setActiveView}} />
        <NavLink id="inventory" label="Inventory" icon={<Archive className="w-5 h-5"/>} colorClass="text-cyan-500" {...{activeView, setActiveView}} />
    </NavCategory>
  );
  
  const aiToolsViews = (
    <NavCategory label="AI Tools" emoji="✨">
        {currentUserRole === 'admin' && (
            <NavLink id="renovation-advisor" label="Renovation Advisor" icon={<Lightbulb className="w-5 h-5"/>} colorClass="text-yellow-500" {...{activeView, setActiveView}} />
        )}
        <NavLink id="session-summarizer" label="Session Summarizer" icon={<Bot className="w-5 h-5"/>} colorClass="text-purple-500" {...{activeView, setActiveView}} />
    </NavCategory>
  );

  const guestViews = (
    <NavCategory label="Guest Experience" emoji="❤️">
      <NavLink id="guest-services" label="Guest Welcome" icon={<Sparkles className="w-5 h-5"/>} colorClass="text-fuchsia-500" {...{activeView, setActiveView}} />
      <NavLink id="local-guide" label="Local Guide" icon={<MapPin className="w-5 h-5"/>} colorClass="text-lime-500" {...{activeView, setActiveView}} />
    </NavCategory>
  );

  return (
    <nav className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col p-4 shadow-lg z-10">
      <div className="flex items-center gap-3 mb-8 px-2">
        <span className="text-3xl">🏨</span>
        <span className="text-xl font-bold text-slate-800 dark:text-white">Hotel Brendle</span>
      </div>
      <div className="flex flex-col gap-4 flex-grow">
        {currentUserRole === 'admin' && (
            <>
                {operationsViews}
                {managementViews}
                {aiToolsViews}
            </>
        )}
        {currentUserRole === 'staff' && (
            <>
                {operationsViews}
                {aiToolsViews}
            </>
        )}
        {currentUserRole === 'guest' && guestViews}
      </div>
      
       <div className="mt-auto space-y-2">
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onOpenAbout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm text-slate-500 dark:text-slate-400 hover:bg-brand-primary-50 dark:hover:bg-slate-700 hover:text-brand-primary-600 dark:hover:text-white`}
            >
              <Info className="w-5 h-5" />
              <span className="font-medium">About This Project</span>
            </button>
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">&copy; 2025 Hotel Brendle Renovation Project.</p>
            </div>
      </div>
    </nav>
  );
};

export default Sidebar;