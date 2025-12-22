
import React, { useState, useMemo, useRef } from 'react';
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
  Folder,
  User,
  CheckSquare,
  Square,
  Edit3,
  Building2,
  Info,
  FileText,
  Upload,
  X,
  Download,
  FileUp,
  CloudUpload
} from 'lucide-react';
import { Contact, MeetingTask, MeetingMode, ParticipantMode, ParticipantStatus, Position } from '../types';

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
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [expandedTaskDetails, setExpandedTaskDetails] = useState<string[]>([]);

  // 表单状态
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [defaultAttachments, setDefaultAttachments] = useState<string[]>([]);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);

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
      location: mode !== MeetingMode.ONLINE ? location : undefined,
      meetingId: mode !== MeetingMode.OFFLINE ? meetingId : undefined,
      meetingLink: mode !== MeetingMode.OFFLINE ? meetingLink : undefined,
      contactPerson: '技术办',
      contactPhone: '010-88886666',
      attachments: defaultAttachments,
      mode,
      participants: selectedParticipants,
      status: 'draft',
      createdAt: editingTaskId ? (tasks.find(t => t.id === editingTaskId)?.createdAt || Date.now()) : Date.now()
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
    setActiveStep(1);
    setExpandedDepts([]);
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个会议任务吗？此操作不可撤销。')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleTaskDetails = (taskId: string) => {
    setExpandedTaskDetails(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
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

  // 强化文件上传处理
  const processFiles = (files: FileList | null, isDefault: boolean, contactId?: string) => {
    if (!files) return;
    const fileNames = Array.from(files).map(f => f.name);
    
    if (isDefault) {
      setDefaultAttachments(prev => [...prev, ...fileNames]);
    } else if (contactId) {
      setSelectedParticipants(prev => prev.map(p => 
        p.contactId === contactId ? { ...p, customFiles: [...p.customFiles, ...fileNames] } : p
      ));
    }
  };

  const handleFileDrop = (e: React.DragEvent, isDefault: boolean, contactId?: string) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files, isDefault, contactId);
  };

  const handleDownloadCheck = (fileName: string) => {
    // 模拟下载检查逻辑
    alert(`正在对文件进行核验下载：${fileName}\n[模拟下载成功]`);
    // 实际场景下会创建 a 标签触发下载
    const element = document.createElement("a");
    const file = new Blob(["会议文件模拟数据"], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const removeFile = (isDefault: boolean, fileName: string, contactId?: string) => {
    if (isDefault) {
      setDefaultAttachments(prev => prev.filter(f => f !== fileName));
    } else if (contactId) {
      setSelectedParticipants(prev => prev.map(p => 
        p.contactId === contactId ? { ...p, customFiles: p.customFiles.filter(f => f !== fileName) } : p
      ));
    }
  };

  const updateProcurementInfo = (contactId: string, method: string, budget: string) => {
    setSelectedParticipants(prev => prev.map(p => 
      p.contactId === contactId ? { ...p, procurementInfo: { method, budget } } : p
    ));
  };

  const toggleFileOption = (contactId: string, useDefault: boolean) => {
    setSelectedParticipants(prev => prev.map(p => 
      p.contactId === contactId ? { ...p, useDefaultFiles: useDefault } : p
    ));
  };

  const renderTaskParticipantsVisualization = (task: MeetingTask) => {
    const taskDepts: Record<string, Contact[]> = {};
    task.participants.forEach(p => {
      const contact = contacts.find(c => c.id === p.contactId);
      if (contact) {
        if (!taskDepts[contact.dept]) taskDepts[contact.dept] = [];
        taskDepts[contact.dept].push(contact);
      }
    });

    return (
      <div className="mt-4 space-y-3 bg-slate-50/50 rounded-xl p-4 border border-slate-100/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Building2 size={12} />
          参会部门及人员分布
        </p>
        <div className="space-y-3">
          {Object.entries(taskDepts).map(([dept, deptParticipants]) => (
            <div key={dept} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">{dept}</span>
                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md">{deptParticipants.length}人</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-2 border-l-2 border-slate-200">
                {deptParticipants.map(cp => (
                  <div key={cp.id} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs text-slate-600 shadow-sm">
                    <User size={10} className="text-blue-500" />
                    <span>{cp.name}</span>
                    <span className="text-[10px] text-slate-400">({cp.position})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(task)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-2xl transition-all shadow-sm">
                  <Edit3 size={20} />
                </button>
                <button onClick={(e) => deleteTask(task.id, e)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-2xl transition-all shadow-sm">
                  <Trash2 size={20} />
                </button>
                <div className="w-px h-8 bg-slate-200 mx-2" />
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                  <span>进入发送控制台</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="px-8 pb-8">
               <button onClick={() => toggleTaskDetails(task.id)} className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors border-t border-slate-50 mt-2">
                 {expandedTaskDetails.includes(task.id) ? (
                   <>收起参会详情 <ChevronDown size={14} className="rotate-180" /></>
                 ) : (
                   <>查看部门与人员分布可视化 <ChevronDown size={14} /></>
                 )}
               </button>
               {expandedTaskDetails.includes(task.id) && renderTaskParticipantsVisualization(task)}
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl min-h-[700px] my-auto rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{editingTaskId ? '编辑会议任务' : '创建新任务'}</h3>
              </div>
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
                      {step === 1 ? '基本参数' : step === 2 ? '确定名单' : '差异文件与核验'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              {activeStep === 1 && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Users size={16} className="text-blue-600" />
                       会议模式选择
                    </label>
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
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议全称</label>
                      <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">召开时间</label>
                      <input type="datetime-local" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={time} onChange={e => setTime(e.target.value)} />
                    </div>
                    {(mode === MeetingMode.OFFLINE || mode === MeetingMode.MIXED) && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议地点</label>
                        <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                    )}
                  </div>

                  {/* 默认会议文件上传 - 强化版 */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      默认会议文件 (全员可见)
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {defaultAttachments.map(f => (
                        <div key={f} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-left-2">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-blue-500" />
                            <span className="text-sm font-bold text-slate-700">{f}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDownloadCheck(f)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="下载核验">
                              <Download size={18} />
                            </button>
                            <button onClick={() => removeFile(true, f)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <label 
                        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] transition-all cursor-pointer ${
                          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => handleFileDrop(e, true)}
                      >
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={(e) => processFiles(e.target.files, true)} 
                        />
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                           <CloudUpload size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-700 text-center">点击浏览本地文件 或 将文件直接拖入此区域</p>
                        <p className="text-xs text-slate-400 mt-2">支持 PDF, Word, PPT 等常见公文格式</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full animate-in fade-in duration-300">
                  {/* 通讯录选择 (强化部门勾选交互) */}
                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center justify-between px-2">
                      <span>通讯录/组织架构</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">点击显眼部门框批量选择</span>
                    </h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2.5rem] bg-slate-50/30 p-8 custom-scrollbar">
                      {Object.entries(groupedContacts).map(([dept, deptContacts]) => {
                        const deptContactIds = deptContacts.map(c => c.id);
                        const selectedInDept = selectedParticipants.filter(p => deptContactIds.includes(p.contactId));
                        const isAllSelected = selectedInDept.length === deptContacts.length && deptContacts.length > 0;
                        const isSomeSelected = selectedInDept.length > 0 && !isAllSelected;

                        return (
                          <div key={dept} className="mb-6">
                            {/* 显眼的部门勾选行 */}
                            <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group shadow-sm ${
                              isAllSelected 
                                ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-500' 
                                : isSomeSelected 
                                  ? 'bg-blue-50 border-blue-200 border-2' 
                                  : 'bg-white border border-slate-100 hover:border-blue-200'
                            }`} onClick={() => toggleDeptSelection(dept)}>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                isAllSelected ? 'bg-white text-blue-600' : 
                                isSomeSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-300'
                              }`}>
                                {isAllSelected ? <CheckSquare size={20} strokeWidth={3} /> : isSomeSelected ? <div className="w-3 h-1 bg-blue-700 rounded-full" /> : <Square size={20} />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`font-black text-sm ${isAllSelected ? 'text-white' : 'text-slate-700'}`}>{dept}</span>
                                <span className={`text-[10px] font-bold ${isAllSelected ? 'text-blue-100' : 'text-slate-400'}`}>共 {deptContacts.length} 人</span>
                              </div>
                              <ChevronRight size={16} className={`ml-auto transition-transform ${isAllSelected ? 'text-white' : 'text-slate-300'}`} />
                            </div>
                            
                            <div className="ml-12 mt-3 space-y-2 border-l-2 border-slate-100 pl-4 py-1">
                              {deptContacts.map(c => {
                                const isSelected = selectedParticipants.find(p => p.contactId === c.id);
                                return (
                                  <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'hover:bg-slate-100/50 text-slate-600'}`} onClick={() => toggleParticipant(c.id)}>
                                    {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-300" />}
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
                  
                  {/* 已选名单面板 */}
                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">已选人员清单 ({selectedParticipants.length})</h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2.5rem] bg-blue-50/20 p-8 space-y-3 custom-scrollbar">
                      {selectedParticipants.map(p => {
                        const contact = contacts.find(c => c.id === p.contactId);
                        return contact ? (
                          <div key={p.contactId} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between animate-in zoom-in-95">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">{contact.name.charAt(0)}</div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">{contact.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{contact.dept} · {contact.position}</p>
                              </div>
                            </div>
                            <button onClick={() => toggleParticipant(p.contactId)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </div>
                        ) : null;
                      })}
                      {selectedParticipants.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
                          <Users size={48} className="mb-4 opacity-20" />
                          <p>请从左侧通讯录添加人员</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                  <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex items-start gap-6 shadow-2xl shadow-blue-500/20">
                    <Info size={32} />
                    <div>
                      <h4 className="text-xl font-black mb-1">差异化文件管理</h4>
                      <p className="text-blue-50 font-medium leading-relaxed">采购部专家可在此环节核验或独立配置专属会议文件，确保涉及招标评审的信息精准送达。</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedParticipants.some(p => contacts.find(c => c.id === p.contactId)?.isProcurement) ? (
                      selectedParticipants.filter(p => contacts.find(c => c.id === p.contactId)?.isProcurement).map(p => {
                        const contact = contacts.find(c => c.id === p.contactId);
                        return (
                          <div key={p.contactId} className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 font-black">
                                  {contact?.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-slate-800">{contact?.name} <span className="text-amber-600 text-sm">(采购业务专家)</span></h4>
                                  <p className="text-xs text-slate-400 font-bold">{contact?.dept} · {contact?.position}</p>
                                </div>
                              </div>
                              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                <button 
                                  onClick={() => toggleFileOption(p.contactId, true)}
                                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${p.useDefaultFiles ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                  使用默认文件
                                </button>
                                <button 
                                  onClick={() => toggleFileOption(p.contactId, false)}
                                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${!p.useDefaultFiles ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                  独立上传文件
                                </button>
                              </div>
                            </div>

                            {!p.useDefaultFiles && (
                              <div className="space-y-3">
                                {p.customFiles.map(f => (
                                  <div key={f} className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                      <FileText size={18} className="text-indigo-600" />
                                      <span className="text-sm font-bold text-indigo-800">{f}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => handleDownloadCheck(f)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors">
                                        <Download size={18} />
                                      </button>
                                      <button onClick={() => removeFile(false, f, p.contactId)} className="p-2 text-indigo-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors">
                                        <X size={18} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <label 
                                  className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-indigo-200 rounded-[1.5rem] text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleFileDrop(e, false, p.contactId)}
                                >
                                  <input type="file" multiple className="hidden" onChange={(e) => processFiles(e.target.files, false, p.contactId)} />
                                  <FileUp size={24} className="mb-2" />
                                  <span className="text-xs font-bold uppercase tracking-widest">点击或拖拽上传采购专用资料</span>
                                </label>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">评审采购方式</label>
                                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={p.procurementInfo?.method || ''} onChange={e => updateProcurementInfo(p.contactId, e.target.value, p.procurementInfo?.budget || '')} placeholder="如：公开招标" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">预估项目预算 (万元)</label>
                                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={p.procurementInfo?.budget || ''} onChange={e => updateProcurementInfo(p.contactId, p.procurementInfo?.method || '', e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 font-bold space-y-4">
                        <CheckSquare size={48} className="opacity-20" />
                        <p>本次参会人员中不涉及“采购属性”专家，无需特殊配置</p>
                      </div>
                    )}
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
