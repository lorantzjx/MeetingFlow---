
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Send, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  ChevronRight,
  Bell
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import ContactsManager from './components/ContactsManager.tsx';
import MeetingManager from './components/MeetingManager.tsx';
import ExecutionConsole from './components/ExecutionConsole.tsx';
import Settings from './components/Settings.tsx';
import { Contact, MeetingTask, AppSettings } from './types.ts';
import { INITIAL_CONTACTS, DEPARTMENTS, DEFAULT_TEMPLATES, INITIAL_POSITIONS } from './constants.ts';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </Link>
);

const AppContent = () => {
  const location = useLocation();
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('mf_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });
  const [tasks, setTasks] = useState<MeetingTask[]>(() => {
    const saved = localStorage.getItem('mf_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mf_settings');
    const parsed = saved ? JSON.parse(saved) : null;
    return {
      departments: parsed?.departments || DEPARTMENTS,
      positions: parsed?.positions || INITIAL_POSITIONS,
      rpaDelayMin: parsed?.rpaDelayMin || 2,
      rpaDelayMax: parsed?.rpaDelayMax || 5,
      smsUrl: parsed?.smsUrl || '',
      wechatPath: parsed?.wechatPath || '',
      templates: parsed?.templates || DEFAULT_TEMPLATES
    };
  });

  useEffect(() => { localStorage.setItem('mf_contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('mf_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('mf_settings', JSON.stringify(settings)); }, [settings]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">M</div>
          <span className="text-xl font-bold text-slate-800">MeetingFlow</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 py-4">
          <SidebarItem to="/" icon={LayoutDashboard} label="统计看板" active={location.pathname === '/'} />
          <SidebarItem to="/meetings" icon={Calendar} label="会议配置" active={location.pathname === '/meetings'} />
          <SidebarItem to="/contacts" icon={Users} label="通讯录管理" active={location.pathname === '/contacts'} />
          <SidebarItem to="/execution" icon={Send} label="发送控制台" active={location.pathname === '/execution'} />
        </nav>
        <div className="p-4 mt-auto border-t border-slate-100">
          <SidebarItem to="/settings" icon={SettingsIcon} label="系统设置" active={location.pathname === '/settings'} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {location.pathname === '/' && '数据概览'}
            {location.pathname === '/meetings' && '会议任务管理'}
            {location.pathname === '/contacts' && '通讯录管理'}
            {location.pathname === '/execution' && '自动化控制台'}
            {location.pathname === '/settings' && '系统参数配置'}
          </h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-blue-600"><Bell size={20} /></button>
            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard tasks={tasks} contacts={contacts} />} />
            <Route path="/meetings" element={<MeetingManager tasks={tasks} setTasks={setTasks} contacts={contacts} positions={settings.positions} templates={settings.templates} />} />
            <Route path="/contacts" element={<ContactsManager contacts={contacts} setContacts={setContacts} departments={settings.departments} positions={settings.positions} />} />
            <Route path="/execution" element={<ExecutionConsole tasks={tasks} setTasks={setTasks} contacts={contacts} settingsTemplates={settings.templates} />} />
            <Route path="/settings" element={<Settings settings={settings} setSettings={setSettings} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
