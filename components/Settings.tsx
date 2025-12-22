
import React, { useState } from 'react';
// Added X to the lucide-react imports
import { Settings as SettingsIcon, Plus, Trash2, Save, Terminal, Building2, MessageSquare, Copy, Tag, Cpu, Clock, FolderEdit, X } from 'lucide-react';
import { AppSettings, Template } from '../types';

interface Props {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, setSettings }) => {
  const [newDept, setNewDept] = useState('');
  
  const tags = [
    { label: '时间', value: '{{时间}}' },
    { label: '主题', value: '{{主题}}' },
    { label: '地点', value: '{{地点}}' },
    { label: '联系人', value: '{{联系人}}' },
    { label: '联系电话', value: '{{联系电话}}' },
    { label: '发布部门', value: '{{发布部门}}' },
    { label: '姓名', value: '{{姓名}}' },
    { label: '姓', value: '{{姓}}' },
    { label: '职务', value: '{{职务}}' }
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

  const addTemplate = (type: 'sms' | 'wechat') => {
    const newT: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: `新${type === 'sms' ? '短信' : '微信'}模板`,
      type,
      content: ''
    };
    setSettings({ ...settings, templates: [...settings.templates, newT] });
  };

  const removeTemplate = (id: string) => {
    setSettings({ ...settings, templates: settings.templates.filter(t => t.id !== id) });
  };

  const addDept = () => {
    if (newDept && !settings.departments.includes(newDept)) {
      updateSetting('departments', [...settings.departments, newDept]);
      setNewDept('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* RPA 自动化配置部分 */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Cpu className="text-blue-600" size={24} />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">RPA 自动化引擎配置</h3>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FolderEdit size={16} className="text-blue-500" />
                微信程序执行路径 (WeChat.exe)
              </label>
              <input 
                type="text" 
                value={settings.wechatPath}
                onChange={(e) => updateSetting('wechatPath', e.target.value)}
                placeholder="例如: C:\Program Files (x86)\Tencent\WeChat\WeChat.exe"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400 font-bold">RPA 桥接器将调用此路径启动并激活微信窗口进行操作。</p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                自动填充防检测延时 (秒)
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">最小值</span>
                  <input type="number" value={settings.rpaDelayMin} onChange={(e) => updateSetting('rpaDelayMin', parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">最大值</span>
                  <input type="number" value={settings.rpaDelayMax} onChange={(e) => updateSetting('rpaDelayMax', parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">在此范围内随机等待，模拟真实人类打字与文件选择间隔。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 模板自定义部分 */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-indigo-600" size={24} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">智能通知模板库</h3>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => addTemplate('sms')} className="text-xs font-black px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-all">+ 新增短信模板</button>
            <button onClick={() => addTemplate('wechat')} className="text-xs font-black px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 border border-blue-100 transition-all">+ 新增微信模板</button>
          </div>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {settings.templates.map(t => (
              <div key={t.id} className="p-6 border-2 border-slate-100 rounded-[2.5rem] bg-slate-50/50 space-y-4 relative group hover:border-blue-200 transition-all">
                <button onClick={() => removeTemplate(t.id)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={20} />
                </button>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.type === 'sms' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {t.type}
                  </span>
                  <input value={t.name} onChange={e => updateTemplate(t.id, 'name', e.target.value)} className="bg-transparent font-black text-slate-800 outline-none focus:text-blue-600 text-lg" />
                </div>
                <textarea 
                  value={t.content} 
                  onChange={e => updateTemplate(t.id, 'content', e.target.value)} 
                  placeholder="在此输入模板正文，点击下方标签插入变量..." 
                  className="w-full h-48 p-6 text-base font-medium border-0 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 bg-white shadow-inner custom-scrollbar" 
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button key={tag.value} onClick={() => updateTemplate(t.id, 'content', t.content + tag.value)} className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all">
                      <Tag size={12} className="mr-1.5" />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 组织部门管理 */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Building2 className="text-emerald-600" size={24} />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">组织部门映射设置</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex flex-wrap gap-3">
            {settings.departments.map(dept => (
              <div key={dept} className="flex items-center gap-2 px-5 py-2 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm border border-slate-200 group">
                {dept}
                <button onClick={() => updateSetting('departments', settings.departments.filter(d => d !== dept))} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input 
                value={newDept} 
                onChange={e => setNewDept(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && addDept()}
                placeholder="新增部门名称..." 
                className="px-5 py-2 border-2 border-dashed border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" 
              />
              <button onClick={addDept} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"><Plus size={20} /></button>
            </div>
          </div>
        </div>
      </section>
      
      <div className="fixed bottom-12 right-12 z-40">
        <button 
          onClick={() => { localStorage.setItem('mf_settings', JSON.stringify(settings)); alert('系统设置已全量持久化成功！'); }} 
          className="flex items-center space-x-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95 border border-slate-700"
        >
          <Save size={24} />
          <span>保存所有配置并生效</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
