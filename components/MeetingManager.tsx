
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
  Check,
  CheckSquare,
  Square,
  Edit3,
  Building2,
  Info,
  FileText,
  Upload,
  X,
  Download,
  Link as LinkIcon,
  Hash,
  CloudUpload
} from 'lucide-react';
import { Contact, MeetingTask, MeetingMode, ParticipantMode, ParticipantStatus } from '../types';

interface Props {
  tasks: MeetingTask[];
  setTasks: React.Dispatch<React.SetStateAction<MeetingTask[]>>;
  contacts: Contact[];
}

const MeetingManager: React.FC<Props> = ({ tasks, setTasks, contacts }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantStatus[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [mode, setMode] = useState<MeetingMode>(MeetingMode.OFFLINE);
  const [expandedTaskDetails, setExpandedTaskDetails] = useState<string[]>([]);

  // 表单状态
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [defaultAttachments, setDefaultAttachments] = useState<string[]>([]);

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    contacts.forEach(c => {
      const dept = c.dept || '默认部门';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(c);
    });
    return groups;
  }, [contacts]);

  const handleEdit = (task: MeetingTask) => {
    setEditingTaskId(task.id);
    setSubject(task.subject);
    setTime(task.time);
    setLocation(task.location || '');
    setMeetingId(task.meetingId || '');
    setMeetingLink(task.meetingLink || '');
    setMode(task.mode);
    setSelectedParticipants(task.participants);
    setDefaultAttachments(task.attachments || []);
    setActiveStep(1);
    setIsFormOpen(true);
  };

  const handleCreateOrUpdate = () => {
    const taskData: MeetingTask = {
      id: editingTaskId || Math.random().toString(36).substr(2, 9),
      subject,
      time,
      location: (mode === MeetingMode.OFFLINE || mode === MeetingMode.MIXED) ? location : undefined,
      meetingId: (mode === MeetingMode.ONLINE || mode === MeetingMode.MIXED) ? meetingId : undefined,
      meetingLink: (mode === MeetingMode.ONLINE || mode === MeetingMode.MIXED) ? meetingLink : undefined,
      contactPerson: '张佳欣',
      contactPhone: '3723/19200545192',
      attachments: defaultAttachments,
      mode,
      participants: selectedParticipants,
      status: 'draft',
      createdAt: editingTaskId ? (tasks.find(t => t.id === editingTaskId)?.createdAt || Date.now()) : Date.now()
    };

    setTasks(prev => editingTaskId ? prev.map(t => t.id === editingTaskId ? taskData : t) : [taskData, ...prev]);
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
    setActiveStep(1);
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除该会议任务？')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleParticipant = (contactId: string) => {
    setSelectedParticipants(prev => {
      const exists = prev.find(p => p.contactId === contactId);
      if (exists) return prev.filter(p => p.contactId !== contactId);
      return [...prev, { 
        contactId, 
        mode: mode === MeetingMode.ONLINE ? ParticipantMode.ONLINE : ParticipantMode.OFFLINE,
        replied: false,
        useDefaultFiles: true,
        customFiles: []
      }];
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
        mode: mode === MeetingMode.ONLINE ? ParticipantMode.ONLINE : ParticipantMode.OFFLINE,
        replied: false,
        useDefaultFiles: true,
        customFiles: []
      }));
      setSelectedParticipants(prev => [...prev, ...newItems]);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">所有会议任务</h2>
          <p className="text-slate-500 text-sm mt-1">管理、编辑及预览您的通知任务清单</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={20} />
          <span>新建通知任务</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
            <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className={`w-16 h-16 shrink-0 rounded-3xl flex items-center justify-center shadow-inner ${
                task.mode === MeetingMode.ONLINE ? 'bg-indigo-50 text-indigo-600' :
                task.mode === MeetingMode.OFFLINE ? 'bg-amber-50 text-amber-600' :
                'bg-teal-50 text-teal-600'
              }`}>
                {task.mode === MeetingMode.ONLINE ? <Video size={32} /> : 
                 task.mode === MeetingMode.OFFLINE ? <MapPin size={32} /> : <Users size={32} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    task.mode === MeetingMode.ONLINE ? 'bg-indigo-100 text-indigo-700' :
                    task.mode === MeetingMode.OFFLINE ? 'bg-amber-100 text-amber-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>
                    {task.mode}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    创建于 {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-2">{task.subject}</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    <Calendar size={14} className="mr-2 text-slate-400" />
                    <span>{task.time.replace('T', ' ')}</span>
                  </div>
                  {task.location && (
                    <div className="flex items-center text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      <MapPin size={14} className="mr-2 text-slate-400" />
                      <span>{task.location}</span>
                    </div>
                  )}
                  {task.meetingId && (
                    <div className="flex items-center text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      <Hash size={14} className="mr-2 text-indigo-400" />
                      <span>ID: {task.meetingId}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(task)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-2xl transition-all shadow-sm">
                  <Edit3 size={20} />
                </button>
                <button onClick={(e) => deleteTask(task.id, e)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-2xl transition-all shadow-sm">
                  <Trash2 size={20} />
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                  <span>控制台</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl min-h-[700px] my-auto rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800">{editingTaskId ? '编辑会议' : '创建新任务'}</h3>
              <div className="flex items-center space-x-10">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                      activeStep === step ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 
                      activeStep > step ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {activeStep > step ? <Check size={20} /> : step}
                    </div>
                    <span className={`text-sm font-black uppercase tracking-widest ${activeStep === step ? 'text-blue-600' : 'text-slate-400'}`}>
                      {step === 1 ? '基础配置' : step === 2 ? '选择人员' : '文件与确认'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              {activeStep === 1 && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">会议模式选择</label>
                    <div className="grid grid-cols-3 gap-6">
                      {Object.values(MeetingMode).map(m => (
                        <button key={m} onClick={() => setMode(m)} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${mode === m ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-lg shadow-blue-500/10' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                          <span className="font-black text-sm uppercase tracking-wider">{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议全称 (主题)</label>
                      <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={subject} onChange={e => setSubject(e.target.value)} placeholder="请输入正式会议标题" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">召开时间</label>
                      <input type="datetime-local" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={time} onChange={e => setTime(e.target.value)} />
                    </div>

                    {(mode === MeetingMode.OFFLINE || mode === MeetingMode.MIXED) && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={16} className="text-blue-500" /> 线下地点
                        </label>
                        <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={location} onChange={e => setLocation(e.target.value)} placeholder="如：A座3楼会议室" />
                      </div>
                    )}

                    {(mode === MeetingMode.ONLINE || mode === MeetingMode.MIXED) && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Hash size={16} className="text-indigo-500" /> 会议 ID
                          </label>
                          <input className="w-full px-6 py-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" value={meetingId} onChange={e => setMeetingId(e.target.value)} placeholder="如：881-970-253" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <LinkIcon size={16} className="text-indigo-500" /> 会议链接
                          </label>
                          <input className="w-full px-6 py-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meeting.tencent.com/..." />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full animate-in fade-in">
                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">通讯录/组织架构</h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2.5rem] bg-slate-50/30 p-8 custom-scrollbar">
                      {Object.entries(groupedContacts).map(([dept, deptContacts]) => {
                        const isAllSelected = deptContacts.every(c => selectedParticipants.some(p => p.contactId === c.id));
                        return (
                          <div key={dept} className="mb-6">
                            <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group ${isAllSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100'}`} onClick={() => toggleDeptSelection(dept)}>
                              {isAllSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-300" />}
                              <span className="font-black text-sm">{dept} ({deptContacts.length}人)</span>
                            </div>
                            <div className="ml-8 mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
                              {deptContacts.map(c => {
                                const isSelected = selectedParticipants.find(p => p.contactId === c.id);
                                return (
                                  <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100/50'}`} onClick={() => toggleParticipant(c.id)}>
                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-300" />}
                                    <span className="text-sm font-bold">{c.name}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">({c.position})</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">已选名单 ({selectedParticipants.length})</h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2.5rem] bg-blue-50/20 p-8 space-y-3 custom-scrollbar">
                      {selectedParticipants.map(p => {
                        const contact = contacts.find(c => c.id === p.contactId);
                        return contact ? (
                          <div key={p.contactId} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between animate-in zoom-in-95">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">{contact.name.charAt(0)}</div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">{contact.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{contact.dept}</p>
                              </div>
                            </div>
                            <button onClick={() => toggleParticipant(p.contactId)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
                  <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex items-start gap-6 shadow-2xl">
                    <Info size={32} />
                    <div className="space-y-1">
                      <h4 className="text-xl font-black">会议资料核验</h4>
                      <p className="text-blue-50 font-medium leading-relaxed">请在此处上传评审方案或参会说明。所有成员将在通知中收到下载提醒。</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议附件 (支持拖拽)</label>
                    <div className="grid grid-cols-1 gap-4">
                      {defaultAttachments.map(f => (
                        <div key={f} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700">
                          <span className="flex items-center gap-3"><FileText className="text-blue-500" /> {f}</span>
                          <button onClick={() => setDefaultAttachments(prev => prev.filter(x => x !== f))}><X size={18} className="text-slate-400" /></button>
                        </div>
                      ))}
                      <label className="relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] transition-all cursor-pointer hover:border-blue-300 hover:bg-slate-50">
                        <input type="file" multiple className="hidden" onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files).map(f => f.name);
                            setDefaultAttachments(prev => [...prev, ...newFiles]);
                          }
                        }} />
                        <CloudUpload size={32} className="text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-700">点击或拖拽上传评审文件</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-[3rem]">
              <button onClick={() => setIsFormOpen(false)} className="px-8 py-3 text-slate-500 font-black uppercase hover:bg-slate-100 rounded-2xl transition-all">放弃</button>
              <div className="flex items-center space-x-4">
                {activeStep > 1 && <button onClick={() => setActiveStep(prev => prev - 1)} className="px-8 py-3 border-2 border-slate-200 text-slate-600 font-black rounded-2xl">上一步</button>}
                {activeStep < 3 ? (
                  <button onClick={() => setActiveStep(prev => prev + 1)} className="px-12 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">下一步</button>
                ) : (
                  <button onClick={handleCreateOrUpdate} className="px-16 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-2xl active:scale-95 transition-all">完成配置</button>
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
