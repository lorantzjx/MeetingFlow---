
import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Building2, 
  MessageSquare, 
  Tag, 
  Cpu, 
  Clock, 
  FolderEdit, 
  X,
  UserCheck,
  Search,
  LayoutTemplate,
  Layers,
  Edit2,
  RefreshCcw
} from 'lucide-react';
import { AppSettings, Template } from '../types.ts';
import { DEPARTMENTS, INITIAL_POSITIONS } from '../constants.ts';

interface Props {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, setSettings }) => {
  const [newDept, setNewDept] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [editingItem, setEditingItem] = useState<{type: 'dept' | 'pos', index: number, value: string} | null>(null);
  
  const tags = [
    { label: '时间', value: '{{时间}}' },
    { label: '主题', value: '{{主题}}' },
    { label: '地点', value: '{{地点}}' },
    { label: '会议号', value: '{{会议号}}' },
    { label: '会议链接', value: '{{会议链接}}' },
    { label: '采购方式', value: '{{采购方式}}' },
    { label: '预算', value: '{{预算}}' },
    { label: '姓名', value: '{{姓名}}' },
    { label: '职务', value: '{{职务}}' },
    { label: '日期', value: '{{日期}}' },
    { label: '列表', value: '{{会议列表}}' }
  ];

  const updateSetting = (field: keyof AppSettings, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const updateTemplate = (id: string, field: string, value: string) => {
    setSettings({
      ...settings,
      templates: settings.templates.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  const addTemplate = (type: 'sms' | 'wechat' | 'multi') => {
    const newT: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: `新${type === 'sms' ? '短信' : type === 'wechat' ? '微信' : '多项聚合'}模板`,
      type,
      content: ''
    };
    setSettings({ ...settings, templates: [...settings.templates, newT] });
  };

  const removeTemplate = (id: string) => {
    setSettings({ ...settings, templates: settings.templates.filter(t => t.id !== id) });
  };

  const handleAddDept = () => {
    if (newDept && !settings.departments.includes(newDept)) {
      updateSetting('departments', [...settings.departments, newDept]);
      setNewDept('');
    }
  };

  const handleAddPosition = () => {
    if (newPosition && !settings.positions.includes(newPosition)) {
      updateSetting('positions', [...settings.positions, newPosition]);
      setNewPosition('');
    }
  };

  const handleRemoveDept = (dept: string) => {
    updateSetting('departments', settings.departments.filter(d => d !== dept));
  };

  const handleRemovePosition = (pos: string) => {
    updateSetting('positions', settings.positions.filter(p => p !== pos));
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    if (editingItem.type === 'dept') {
      const newList = [...settings.departments];
      newList[editingItem.index] = editingItem.value;
      updateSetting('departments', newList);
    } else {
      const newList = [...settings.positions];
      newList[editingItem.index] = editingItem.value;
      updateSetting('positions', newList);
    }
    setEditingItem(null);
  };

  const resetToDefault = () => {
    if (confirm('确定要将部门和职务重置为系统默认吗？当前自定义修改将丢失。')) {
      setSettings({
        ...settings,
        departments: DEPARTMENTS,
        positions: INITIAL_POSITIONS
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <Building2 className="text-blue-600" size={24} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">基础数据字典</h3>
          </div>
          <button 
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            <RefreshCcw size={14} />
            重置为默认值
          </button>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Layers size={16} className="text-blue-500" /> 部门清单
              </label>
              <span className="text-[10px] font-bold text-slate-400">{settings.departments.length} 个部门</span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDept()}
                placeholder="输入新部门名称..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
              />
              <button onClick={handleAddDept} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              {settings.departments.map((dept, idx) => (
                <div key={dept + idx} className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-all">
                  {editingItem?.type === 'dept' && editingItem.index === idx ? (
                    <input autoFocus className="w-20 outline-none text-sm font-bold" value={editingItem.value} onChange={e => setEditingItem({...editingItem, value: e.target.value})} onBlur={handleUpdateItem} onKeyDown={e => e.key === 'Enter' && handleUpdateItem()} />
                  ) : (
                    <span className="text-sm font-bold text-slate-700 cursor-pointer" onClick={() => setEditingItem({type: 'dept', index: idx, value: dept})}>{dept}</span>
                  )}
                  <button onClick={() => handleRemoveDept(dept)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <UserCheck size={16} className="text-indigo-500" /> 职务/称呼
              </label>
              <span className="text-[10px] font-bold text-slate-400">{settings.positions.length} 种预设</span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newPosition}
                onChange={e => setNewPosition(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPosition()}
                placeholder="输入新称呼 (如: 主任)..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
              />
              <button onClick={handleAddPosition} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              {settings.positions.map((pos, idx) => (
                <div key={pos + idx} className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-all">
                  {editingItem?.type === 'pos' && editingItem.index === idx ? (
                    <input autoFocus className="w-20 outline-none text-sm font-bold" value={editingItem.value} onChange={e => setEditingItem({...editingItem, value: e.target.value})} onBlur={handleUpdateItem} onKeyDown={e => e.key === 'Enter' && handleUpdateItem()} />
                  ) : (
                    <span className="text-sm font-bold text-slate-700 cursor-pointer" onClick={() => setEditingItem({type: 'pos', index: idx, value: pos})}>{pos}</span>
                  )}
                  <button onClick={() => handleRemovePosition(pos)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Cpu className="text-blue-600" size={24} />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">RPA 自动化引擎配置</h3>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><FolderEdit size={16} /> 程序路径 (WeChat.exe)</label>
              <input type="text" value={settings.wechatPath} onChange={e => updateSetting('wechatPath', e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock size={16} /> 防检测随机延时 (秒)</label>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Min</span>
                  <input type="number" value={settings.rpaDelayMin} onChange={e => updateSetting('rpaDelayMin', parseInt(e.target.value))} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Max</span>
                  <input type="number" value={settings.rpaDelayMax} onChange={e => updateSetting('rpaDelayMax', parseInt(e.target.value))} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-indigo-600" size={24} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">智能通知模板库</h3>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => addTemplate('sms')} className="text-xs font-black px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">+ 短信模板</button>
            <button onClick={() => addTemplate('wechat')} className="text-xs font-black px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">+ 微信模板</button>
            <button onClick={() => addTemplate('multi')} className="text-xs font-black px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 flex items-center gap-1 hover:bg-amber-100 transition-colors">
              <Layers size={12} /> + 多会议聚合模板
            </button>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {settings.templates.map(t => (
              <div key={t.id} className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-slate-50/50 space-y-4 relative group hover:border-blue-200 transition-all">
                <button onClick={() => removeTemplate(t.id)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={20} />
                </button>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${t.type === 'sms' ? 'bg-indigo-600' : t.type === 'wechat' ? 'bg-blue-600' : 'bg-amber-600'}`}>
                    {t.type === 'multi' ? '聚合' : t.type}
                  </span>
                  <input value={t.name} onChange={e => updateTemplate(t.id, 'name', e.target.value)} className="bg-transparent font-black text-slate-800 outline-none text-lg border-b-2 border-transparent focus:border-blue-500/20" />
                </div>
                <textarea value={t.content} onChange={e => updateTemplate(t.id, 'content', e.target.value)} className="w-full h-56 p-6 text-base font-medium border-0 rounded-[2rem] outline-none bg-white shadow-inner custom-scrollbar resize-none leading-relaxed" />
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map(tag => (
                    <button key={tag.value} onClick={() => updateTemplate(t.id, 'content', t.content + tag.value)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold hover:text-blue-600 hover:border-blue-200 transition-all">{tag.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-12 right-12 z-40">
        <button onClick={() => { localStorage.setItem('mf_settings', JSON.stringify(settings)); alert('系统参数已成功保存并生效！'); }} className="flex items-center space-x-4 px-10 py-6 bg-slate-900 text-white rounded-full font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:-translate-y-1 active:scale-95 group">
          <Save size={24} className="group-hover:rotate-12 transition-transform" />
          <span>保存配置</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
