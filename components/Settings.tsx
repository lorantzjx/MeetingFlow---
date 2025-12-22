
import React, { useState, useEffect } from 'react';
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
  Globe,
  Edit2,
  Briefcase,
  Check,
  AlertTriangle
} from 'lucide-react';
import { AppSettings, Template } from '../types';

interface Props {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, setSettings }) => {
  // 使用本地 state 进行编辑，避免直接修改全局状态导致频繁触发 localStorage 写入
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newDept, setNewDept] = useState('');
  const [newPos, setNewPos] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');
  
  // 当外部 settings 变化时（如首次加载），同步给本地 state
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const tags = [
    { label: '姓', value: '{{姓}}' },
    { label: '姓名', value: '{{姓名}}' },
    { label: '姓名列表', value: '{{姓名列表}}' },
    { label: '时间', value: '{{时间}}' },
    { label: '主题', value: '{{主题}}' },
    { label: '地点', value: '{{地点}}' },
    { label: '线上信息', value: '{{线上信息}}' },
    { label: '会议ID', value: '{{会议ID}}' },
    { label: '发布部门', value: '{{发布部门}}' },
    { label: '联系电话', value: '{{联系电话}}' }
  ];

  const updateLocalSetting = (field: keyof AppSettings, value: any) => {
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const addDept = () => {
    if (newDept && !localSettings.departments.includes(newDept)) {
      updateLocalSetting('departments', [...localSettings.departments, newDept]);
      setNewDept('');
    }
  };

  const addPos = () => {
    if (newPos && !localSettings.positions.includes(newPos)) {
      updateLocalSetting('positions', [...localSettings.positions, newPos]);
      setNewPos('');
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    // 执行全局保存，App.tsx 里的 useEffect 会接手持久化
    setSettings(localSettings);
    
    // 给用户明确的反馈，并稍后恢复状态
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const updateTemplate = (id: string, field: string, value: string) => {
    const newTemplates = localSettings.templates.map(t => t.id === id ? { ...t, [field]: value } : t);
    updateLocalSetting('templates', newTemplates);
  };

  const removeTemplate = (id: string) => {
    updateLocalSetting('templates', localSettings.templates.filter(t => t.id !== id));
  };

  const addTemplate = (type: 'sms' | 'wechat') => {
    const newT: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: `新${type === 'sms' ? '短信' : '微信'}模板`,
      type,
      content: ''
    };
    updateLocalSetting('templates', [...localSettings.templates, newT]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
      {/* 温馨提示 */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-start gap-4 text-amber-800">
        <AlertTriangle className="shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-black text-lg">编辑提示</h4>
          <p className="text-sm font-bold opacity-80">当前处于“草稿模式”，所有修改在点击下方【保存更改并同步】按钮前不会生效。这能有效防止浏览器在频繁输入时崩溃。</p>
        </div>
      </div>

      {/* 外部平台接入配置 */}
      <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Globe className="text-indigo-600" size={24} />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">外部平台接入配置</h3>
        </div>
        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Globe size={16} className="text-indigo-500" />
              天威视讯短信平台 URL
            </label>
            <input 
              type="text" 
              value={localSettings.smsUrl}
              onChange={(e) => updateLocalSetting('smsUrl', e.target.value)}
              placeholder="请输入网页版短信平台的地址"
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-lg focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FolderEdit size={16} className="text-blue-500" />
                微信执行程序路径 (用于 RPA 桥接)
              </label>
              <input 
                type="text" 
                value={localSettings.wechatPath}
                onChange={(e) => updateLocalSetting('wechatPath', e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-xs"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                自动化随机延迟 (秒)
              </label>
              <div className="flex items-center space-x-4">
                <input type="number" value={localSettings.rpaDelayMin} onChange={(e) => updateLocalSetting('rpaDelayMin', parseInt(e.target.value))} className="w-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center" />
                <span className="font-bold text-slate-300">至</span>
                <input type="number" value={localSettings.rpaDelayMax} onChange={(e) => updateLocalSetting('rpaDelayMax', parseInt(e.target.value))} className="w-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 组织管理 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <Building2 className="text-blue-600" size={20} />
            <h3 className="text-lg font-black text-slate-800">部门管理</h3>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex gap-2">
              <input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="新部门" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              <button onClick={addDept} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 h-40 overflow-y-auto content-start p-1 custom-scrollbar">
              {localSettings.departments.map(d => (
                <span key={d} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                  {d}
                  <button onClick={() => updateLocalSetting('departments', localSettings.departments.filter(x => x !== d))} className="hover:text-red-500"><X size={12}/></button>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <Briefcase className="text-amber-600" size={20} />
            <h3 className="text-lg font-black text-slate-800">职务管理</h3>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex gap-2">
              <input value={newPos} onChange={e => setNewPos(e.target.value)} placeholder="新职务" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              <button onClick={addPos} className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 h-40 overflow-y-auto content-start p-1 custom-scrollbar">
              {localSettings.positions.map(p => (
                <span key={p} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                  {p}
                  <button onClick={() => updateLocalSetting('positions', localSettings.positions.filter(x => x !== p))} className="hover:text-red-500"><X size={12}/></button>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 智能模板管理 */}
      <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-emerald-600" size={24} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">智能通知模板</h3>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => addTemplate('sms')} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs border border-indigo-100">+ 短信</button>
            <button onClick={() => addTemplate('wechat')} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-xs border border-blue-100">+ 微信</button>
          </div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {localSettings.templates.map(t => (
            <div key={t.id} className="p-6 border-2 border-slate-100 rounded-[2rem] bg-slate-50/50 space-y-4 relative group">
              <button onClick={() => removeTemplate(t.id)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${t.type === 'sms' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                  {t.type}
                </span>
                <input value={t.name} onChange={e => updateTemplate(t.id, 'name', e.target.value)} className="bg-transparent font-black text-slate-800 outline-none focus:text-blue-600" />
              </div>
              <textarea 
                value={t.content} 
                onChange={e => updateTemplate(t.id, 'content', e.target.value)} 
                className="w-full h-48 p-5 text-base font-bold border-0 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 bg-white shadow-inner custom-scrollbar" 
              />
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button key={tag.value} onClick={() => updateTemplate(t.id, 'content', t.content + tag.value)} className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:border-blue-500 hover:text-blue-600 transition-all">
                    <Tag size={12} className="mr-1.5" /> {tag.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="fixed bottom-12 right-12 z-40">
        <button 
          onClick={handleSave} 
          disabled={saveStatus !== 'idle'}
          className={`flex items-center space-x-3 px-10 py-5 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${
            saveStatus === 'saved' ? 'bg-emerald-600' : 
            saveStatus === 'saving' ? 'bg-blue-400 cursor-not-allowed' :
            'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {saveStatus === 'saved' ? <Check size={24} /> : 
           saveStatus === 'saving' ? <Cpu className="animate-spin" size={24} /> :
           <Save size={24} />}
          <span>
            {saveStatus === 'saved' ? '配置已保存成功' : 
             saveStatus === 'saving' ? '正在同步数据...' :
             '确认保存更改并同步'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
