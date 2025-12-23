
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  MapPin, 
  Video, 
  Users, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Calendar,
  CheckSquare,
  Square,
  Edit3,
  Building2,
  Info,
  Link as LinkIcon,
  Hash,
  LayoutTemplate
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Contact, MeetingTask, MeetingMode, ParticipantMode, ParticipantStatus, Template } from '../types.ts';

interface Props {
  tasks: MeetingTask[];
  setTasks: React.Dispatch<React.SetStateAction<MeetingTask[]>>;
  contacts: Contact[];
  positions: string[];
  templates: Template[];
}

const MeetingManager: React.FC<Props> = ({ tasks, setTasks, contacts, positions, templates }) => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantStatus[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [mode, setMode] = useState<MeetingMode>(MeetingMode.OFFLINE);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);

  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [defaultAttachments, setDefaultAttachments] = useState<string[]>([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string>('');

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    contacts.forEach(c => {
      const dept = c.dept || '默认部门';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(c);
    });
    return groups;
  }, [contacts]);

  const handleModeChange = (newMode: MeetingMode) => {
    setMode(newMode);
    if (newMode === MeetingMode.ONLINE) {
      const t = templates.find(tmp => tmp.id === 'wechat-online');
      if (t) setDefaultTemplateId(t.id);
    } else if (newMode === MeetingMode.OFFLINE) {
      const t = templates.find(tmp => tmp.id === 'wechat-offline');
      if (t) setDefaultTemplateId(t.id);
    }
  };

  const handleEdit = (e: React.MouseEvent, task: MeetingTask) => {
    e.stopPropagation(); 
    setEditingTaskId(task.id);
    setSubject(task.subject);
    setTime(task.time);
    setLocation(task.location || '');
    setMeetingId(task.meetingId || '');
    setMeetingLink(task.meetingLink || '');
    setMode(task.mode);
    setSelectedParticipants(task.participants);
    setDefaultAttachments(task.attachments || []);
    setDefaultTemplateId(task.defaultTemplateId || '');
    setActiveStep(1);
    setIsFormOpen(true);
  };

  // 修复：删除按钮点击没反应 BUG
  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); 
    e.preventDefault();
    if (window.confirm('确定要删除这个会议任务吗？删除后将无法找回。')) {
      // 必须通过 prev 这种函数式方式更新，并确保是新数组引用
      setTasks(prev => {
        const filtered = prev.filter(t => t.id !== taskId);
        return [...filtered];
      });
    }
  };

  const handleCreateOrUpdate = () => {
    const taskData: MeetingTask = {
      id: editingTaskId || Math.random().toString(36).substr(2, 9),
      subject,
      time,
      location: mode !== MeetingMode.ONLINE ? location : undefined,
      meetingId: mode !== MeetingMode.OFFLINE ? meetingId : undefined,
      meetingLink: mode !== MeetingMode.OFFLINE ? meetingLink : undefined,
      contactPerson: '技术办',
      contactPhone: '010-88886666',
      attachments: defaultAttachments,
      mode,
      participants: selectedParticipants,
      status: 'draft',
      createdAt: editingTaskId ? (tasks.find(t => t.id === editingTaskId)?.createdAt || Date.now()) : Date.now(),
      defaultTemplateId
    };

    if (editingTaskId) {
      setTasks(prev => prev.map(t => t.id === editingTaskId ? taskData : t));
    } else {
      setTasks(prev => [taskData, ...prev]);
    }
    
    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setSubject('');
    setTime('');
    setLocation('');
    setMeetingId('');
    setMeetingLink('');
    setDefaultAttachments([]);
    setSelectedParticipants([]);
    setDefaultTemplateId('');
    setActiveStep(1);
  };

  const toggleParticipant = (contactId: string) => {
    setSelectedParticipants(prev => {
      const exists = prev.find(p => p.contactId === contactId);
      if (exists) {
        return prev.filter(p => p.contactId !== contactId);
      } else {
        return [...prev, { 
          contactId, 
          mode: mode === MeetingMode.MIXED ? ParticipantMode.OFFLINE : (mode === MeetingMode.ONLINE ? ParticipantMode.ONLINE : ParticipantMode.OFFLINE),
          replied: false,
          useDefaultFiles: true,
          customFiles: []
        }];
      }
    });
  };

  const toggleDeptSelection = (dept: string) => {
    const deptContacts = groupedContacts[dept] || [];
    const deptContactIds = deptContacts.map(c => c.id);
    const selectedInDept = selectedParticipants.filter(p => deptContactIds.includes(p.contactId));
    
    if (selectedInDept.length === deptContacts.length) {
      setSelectedParticipants(prev => prev.filter(p => !deptContactIds.includes(p.contactId)));
    } else {
      const missing = deptContacts.filter(c => !selectedParticipants.find(p => p.contactId === c.id));
      const newItems = missing.map(c => ({
        contactId: c.id,
        mode: mode === MeetingMode.MIXED ? ParticipantMode.OFFLINE : (mode === MeetingMode.ONLINE ? ParticipantMode.ONLINE : ParticipantMode.OFFLINE),
        replied: false,
        useDefaultFiles: true,
        customFiles: []
      }));
      setSelectedParticipants(prev => [...prev, ...newItems]);
    }
  };

  const toggleTaskExpand = (id: string) => {
    setExpandedTasks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const updateParticipantTemplate = (contactId: string, templateId: string) => {
    setSelectedParticipants(prev => prev.map(p => 
      p.contactId === contactId ? { ...p, templateId: templateId || undefined } : p
    ));
  };

  const toggleFileOption = (contactId: string, useDefault: boolean) => {
    setSelectedParticipants(prev => prev.map(p => 
      p.contactId === contactId ? { ...p, useDefaultFiles: useDefault } : p
    ));
  };

  const updateProcurementInfo = (contactId: string, method: string, budget: string) => {
    setSelectedParticipants(prev => prev.map(p => 
      p.contactId === contactId ? { ...p, procurementInfo: { method, budget } } : p
    ));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">所有会议任务</h2>
          <p className="text-slate-500 text-sm mt-1">管理、编辑及预览您的通知任务清单</p>
        </div>
        <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
          <Plus size={20} />
          <span>新建通知任务</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tasks.map(task => {
          const isExpanded = expandedTasks.includes(task.id);
          const participantsByDept: Record<string, Contact[]> = {};
          task.participants.forEach(p => {
            const contact = contacts.find(c => c.id === p.contactId);
            if (contact) {
              if (!participantsByDept[contact.dept]) participantsByDept[contact.dept] = [];
              participantsByDept[contact.dept].push(contact);
            }
          });

          return (
            <div key={task.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm transition-all overflow-hidden group hover:shadow-lg">
              <div 
                className="p-8 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer"
                onClick={() => toggleTaskExpand(task.id)}
              >
                <div className={`w-16 h-16 shrink-0 rounded-3xl flex items-center justify-center shadow-inner ${task.mode === MeetingMode.ONLINE ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                  {task.mode === MeetingMode.ONLINE ? <Video size={32} /> : <MapPin size={32} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${task.mode === MeetingMode.ONLINE ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                      {task.mode}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      创建于 {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-2">{task.subject}</h3>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                    <span className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <Calendar size={14} className="text-slate-400" />
                      {task.time.replace('T', ' ')}
                    </span>
                    {task.location && (
                      <span className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {task.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleEdit(e, task)} 
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-2xl transition-all"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteTask(e, task.id)} 
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/execution'); }} 
                    className="flex items-center gap-2 px-6 py-4 bg-slate-950 text-white rounded-2xl font-bold ml-4 active:scale-95"
                  >
                    <span>进入发送控制台</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="px-8 pb-4 border-t border-slate-50">
                <button 
                  onClick={() => toggleTaskExpand(task.id)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                >
                  {isExpanded ? '收起参会详情' : '展开参会详情'}
                  <ChevronDown size={14} className={isExpanded ? 'rotate-180' : ''} />
                </button>
                
                {isExpanded && (
                  <div className="py-6 space-y-6 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                      <Building2 size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">参会部门及人员分布</span>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(participantsByDept).map(([dept, deptContacts]) => (
                        <div key={dept} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-800">{dept}</span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md">{deptContacts.length}人</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-4">
                            {deptContacts.map(c => (
                              <div key={c.id} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-600 shadow-sm">
                                <MapPin size={12} className="text-blue-400" />
                                {c.name} ({c.position})
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl min-h-[700px] my-auto rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800">{editingTaskId ? '编辑会议任务' : '创建新任务'}</h3>
              <div className="flex items-center space-x-6">
                {[1, 2, 3].map(step => (
                  <div key={step} className={`flex items-center space-x-2 ${activeStep === step ? 'text-blue-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${activeStep === step ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100'}`}>{step}</div>
                    <span className="text-xs font-black uppercase tracking-widest">{step === 1 ? '基本参数' : step === 2 ? '确定名单' : '差异化配置'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              {activeStep === 1 && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-3 gap-6">
                    {Object.values(MeetingMode).map(m => (
                      <button key={m} onClick={() => handleModeChange(m)} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${mode === m ? 'border-blue-600 bg-blue-50/50 text-blue-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                        <span className="font-black text-sm uppercase tracking-wider">{m}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <LayoutTemplate size={16} className="text-blue-600" />
                       默认通知模板
                    </label>
                    <select 
                      value={defaultTemplateId}
                      onChange={e => setDefaultTemplateId(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">跟随系统默认设置</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议全称</label>
                      <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={subject} onChange={e => setSubject(e.target.value)} placeholder="输入评审会议全称..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">召开时间</label>
                      <input type="datetime-local" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={time} onChange={e => setTime(e.target.value)} />
                    </div>
                    {(mode !== MeetingMode.ONLINE) && (
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议地点</label>
                        <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={location} onChange={e => setLocation(e.target.value)} placeholder="如：403会议室" />
                      </div>
                    )}
                    {(mode !== MeetingMode.OFFLINE) && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Hash size={16} className="text-blue-600" /> 视频会议ID
                          </label>
                          <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={meetingId} onChange={e => setMeetingId(e.target.value)} placeholder="如：881-970-253" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <LinkIcon size={16} className="text-blue-600" /> 视频会议链接
                          </label>
                          <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meeting.tencent.com/dm/..." />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full animate-in fade-in duration-300">
                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">组织架构选择</h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2.5rem] bg-slate-50/30 p-8 custom-scrollbar">
                      {Object.entries(groupedContacts).map(([dept, deptContacts]) => (
                        <div key={dept} className="mb-6">
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 cursor-pointer" onClick={() => toggleDeptSelection(dept)}>
                            <span className="font-black text-sm text-slate-700">{dept}</span>
                            <span className="ml-auto text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-400">{deptContacts.length}人</span>
                          </div>
                          <div className="ml-8 mt-2 space-y-1">
                            {deptContacts.map(c => {
                              const isSelected = selectedParticipants.find(p => p.contactId === c.id);
                              return (
                                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`} onClick={() => toggleParticipant(c.id)}>
                                  {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-300" />}
                                  <span className="text-sm font-bold">{c.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">已选人员清单 ({selectedParticipants.length})</h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2.5rem] bg-blue-50/20 p-8 space-y-3 custom-scrollbar">
                      {selectedParticipants.map(p => {
                        const contact = contacts.find(c => c.id === p.contactId);
                        return contact ? (
                          <div key={p.contactId} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
                            <span className="font-black text-slate-800 text-sm">{contact.name}</span>
                            <button onClick={() => toggleParticipant(p.contactId)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                  <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex items-start gap-6 shadow-2xl">
                    <Info size={32} />
                    <div>
                      <h4 className="text-xl font-black mb-1">差异化核验与专属模板</h4>
                      <p className="text-blue-50 font-medium leading-relaxed">针对特定联系人设置专属通知。采购人员将自动展示评审细节填报项。</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedParticipants.map(p => {
                      const contact = contacts.find(c => c.id === p.contactId);
                      return (
                        <div key={p.contactId} className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black">{contact?.name.charAt(0)}</div>
                              <div>
                                <h4 className="text-lg font-black text-slate-800">{contact?.name} {contact?.isProcurement && <span className="text-amber-600 text-xs ml-2 font-black uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">[采购部]</span>}</h4>
                                <p className="text-xs text-slate-400 font-bold">{contact?.dept} · {contact?.position}</p>
                              </div>
                            </div>
                            <div className="w-64 space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">专属通知模板</label>
                               <select 
                                 value={p.templateId || ''} 
                                 onChange={e => updateParticipantTemplate(p.contactId, e.target.value)}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                               >
                                 <option value="">跟随会议默认设置</option>
                                 {templates.map(t => (
                                   <option key={t.id} value={t.id}>{t.name}</option>
                                 ))}
                               </select>
                            </div>
                          </div>

                          {contact?.isProcurement && (
                            <div className="grid grid-cols-2 gap-4 bg-amber-50/30 p-6 rounded-[1.5rem] border border-amber-100">
                               <div className="space-y-2">
                                 <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">评审采购方式</label>
                                 <input 
                                   className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500" 
                                   value={p.procurementInfo?.method || ''} 
                                   onChange={e => updateProcurementInfo(p.contactId, e.target.value, p.procurementInfo?.budget || '')} 
                                   placeholder="如：公开招标 / 竞争性谈判" 
                                 />
                               </div>
                               <div className="space-y-2">
                                 <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">项目预算 (万元)</label>
                                 <input 
                                   className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500" 
                                   value={p.procurementInfo?.budget || ''} 
                                   onChange={e => updateProcurementInfo(p.contactId, p.procurementInfo?.method || '', e.target.value)} 
                                   placeholder="0.00" 
                                 />
                               </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <button onClick={() => toggleFileOption(p.contactId, true)} className={`px-4 py-2 rounded-xl text-xs font-bold ${p.useDefaultFiles ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>使用默认文件</button>
                            <button onClick={() => toggleFileOption(p.contactId, false)} className={`px-4 py-2 rounded-xl text-xs font-bold ${!p.useDefaultFiles ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>独立上传文件</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-[3rem]">
              <button onClick={() => setIsFormOpen(false)} className="px-8 py-3 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">取消</button>
              <div className="flex items-center space-x-4">
                {activeStep > 1 && <button onClick={() => setActiveStep(prev => prev - 1)} className="px-8 py-3 border-2 border-slate-200 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all">上一步</button>}
                {activeStep < 3 ? (
                  <button onClick={() => setActiveStep(prev => prev + 1)} disabled={activeStep === 1 && !subject} className="px-12 py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30">下一步</button>
                ) : (
                  <button onClick={handleCreateOrUpdate} className="px-16 py-3 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">完成配置</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingManager;
