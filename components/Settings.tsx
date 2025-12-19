
import React, { useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save, Terminal, Building2, MessageSquare, Copy, Tag } from 'lucide-react';
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
    { label: '职务', value: '{{职务}}' }
  ];

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 模板管理 */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">通知模板自定义</h3>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => addTemplate('sms')} className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">+ 短信模板</button>
            <button onClick={() => addTemplate('wechat')} className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">+ 微信模板</button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.templates.map(t => (
              <div key={t.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 space-y-3 relative group">
                <button onClick={() => removeTemplate(t.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.type === 'sms' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                    {t.type}
                  </span>
                  <input 
                    value={t.name}
                    onChange={e => updateTemplate(t.id, 'name', e.target.value)}
                    className="bg-transparent font-bold text-slate-700 outline-none focus:ring-1 ring-blue-500 rounded px-1"
                  />
                </div>
                <textarea 
                  value={t.content}
                  onChange={e => updateTemplate(t.id, 'content', e.target.value)}
                  placeholder="请输入通知正文..."
                  className="w-full h-32 p-3 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <button 
                      key={tag.value}
                      onClick={() => updateTemplate(t.id, 'content', t.content + tag.value)}
                      className="inline-flex items-center px-2 py-1 bg-white border border-slate-200 text-slate-500 rounded text-[10px] hover:border-blue-400 hover:text-blue-600 transition-all"
                    >
                      <Tag size={10} className="mr-1" />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 部门管理 */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
          <Building2 className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold text-slate-800">部门列表</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {settings.departments.map(d => (
              <span key={d} className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium group">
                {d}
                <button onClick={() => {
                  setSettings({ ...settings, departments: settings.departments.filter(dept => dept !== d) });
                }} className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2 max-w-sm">
            <input 
              value={newDept}
              onChange={e => setNewDept(e.target.value)}
              placeholder="新增部门..." 
              className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => {
              if (newDept && !settings.departments.includes(newDept)) {
                setSettings({ ...settings, departments: [...settings.departments, newDept] });
                setNewDept('');
              }
            }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* RPA 配置 */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
          <Terminal className="text-emerald-600" size={20} />
          <h3 className="text-lg font-bold text-slate-800">RPA 执行引擎配置</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">短信平台 Web 登录地址</label>
            <input 
              value={settings.smsUrl}
              onChange={e => setSettings({...settings, smsUrl: e.target.value})}
              placeholder="https://sms-platform.com/login"
              className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">本地微信可执行文件路径</label>
            <input 
              value={settings.wechatPath}
              onChange={e => setSettings({...settings, wechatPath: e.target.value})}
              placeholder="C:\Program Files\Tencent\WeChat\WeChat.exe"
              className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      <div className="fixed bottom-8 right-8">
        <button 
          onClick={() => {
            localStorage.setItem('mf_settings', JSON.stringify(settings));
            alert('设置已保存！');
          }}
          className="flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95"
        >
          <Save size={20} />
          <span>保存所有配置</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
