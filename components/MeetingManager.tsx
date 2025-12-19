
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Copy, 
  MapPin, 
  Video, 
  Users, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  AlertCircle,
  Calendar,
  Check,
  Folder,
  User,
  CheckSquare,
  Square,
  Edit3,
  Building2,
  Info
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

  // 辅助函数：按部门对联系人分组
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    groups['默认部门'] = []; // Ensure at least one group if departments are empty
    contacts.forEach(c => {
      const dept = c.dept || '默认部门';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(c);
    });
    return groups;
  }, [contacts]);

  // 打开编辑模式
  const handleEdit = (task: MeetingTask) => {
    setEditingTaskId(task.id);
    setSubject(task.subject);
    setTime(task.time);
    setLocation(task.location || '');
    setMeetingId(task.meetingId || '');
    setMeetingLink(task.meetingLink || '');
    setMode(task.mode);
    setSelectedParticipants(task.participants);
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
      attachments: [],
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
          replied: false
        }];
      }
    });
  };

  const toggleDeptSelection = (dept: string) => {
    const deptContacts = groupedContacts[dept] || [];
    const deptContactIds = deptContacts.map(c => c.id);
    const selectedInDept = selectedParticipants.filter(p => deptContactIds.includes(p.contactId));
    
    if (selectedInDept.length === deptContactIds.length) {
      setSelectedParticipants(prev => prev.filter(p => !deptContactIds.includes(p.contactId)));
    } else {
      const missing = deptContacts.filter(c => !selectedParticipants.find(p => p.contactId === c.id));
      const newItems = missing.map(c => ({
        contactId: c.id,
        mode: mode === MeetingMode.MIXED ? ParticipantMode.OFFLINE : (mode === MeetingMode.ONLINE ? ParticipantMode.ONLINE : ParticipantMode.OFFLINE),
        replied: false
      }));
      setSelectedParticipants(prev => [...prev, ...newItems]);
    }
  };

  // Fix: Defined updateProcurementInfo to handle participant attribute updates
  const updateProcurementInfo = (contactId: string, method: string, budget: string) => {
    setSelectedParticipants(prev => prev.map(p => 
      p.contactId === contactId ? { ...p, procurementInfo: { method, budget } } : p
    ));
  };

  // 渲染任务的人员分布可视化
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
          {Object.keys(taskDepts).length === 0 && (
            <p className="text-xs text-slate-400 italic">暂未选择参会人员</p>
          )}
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

      <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
            <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
              {/* 会议核心图标 */}
              <div className={`w-16 h-16 shrink-0 rounded-3xl flex items-center justify-center shadow-inner ${
                task.mode === MeetingMode.ONLINE ? 'bg-indigo-50 text-indigo-600' :
                task.mode === MeetingMode.OFFLINE ? 'bg-amber-50 text-amber-600' :
                'bg-teal-50 text-teal-600'
              }`}>
                {task.mode === MeetingMode.ONLINE ? <Video size={32} /> : 
                 task.mode === MeetingMode.OFFLINE ? <MapPin size={32} /> : <Users size={32} />}
              </div>

              {/* 会议信息 */}
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

              {/* 操作区 */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(task)}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-2xl transition-all shadow-sm"
                  title="编辑任务"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={(e) => deleteTask(task.id, e)}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-2xl transition-all shadow-sm"
                  title="删除任务"
                >
                  <Trash2 size={20} />
                </button>
                <div className="w-px h-8 bg-slate-200 mx-2" />
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                  <span>进入发送控制台</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 展开/收起 可视化面板 */}
            <div className="px-8 pb-8">
               <button 
                 onClick={() => toggleTaskDetails(task.id)}
                 className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors border-t border-slate-50 mt-2"
               >
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

        {tasks.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem]">
            <Calendar size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-bold">暂无会议任务</p>
            <p className="text-sm">点击右上角按钮开始创建第一个通知任务</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl min-h-[700px] my-auto rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{editingTaskId ? '编辑会议任务' : '创建新任务'}</h3>
                <p className="text-slate-400 text-sm mt-1">按部就班填充信息，避免通知出错</p>
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
                      {step === 1 ? '基本参数' : step === 2 ? '确定名单' : '高级核验'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              {activeStep === 1 && (
                <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Users size={16} className="text-blue-600" />
                       会议模式选择
                    </label>
                    <div className="grid grid-cols-3 gap-6">
                      {Object.values(MeetingMode).map(m => (
                        <button 
                          key={m} 
                          onClick={() => setMode(m)}
                          className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${
                            mode === m ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-xl shadow-blue-500/10' : 'border-slate-100 hover:border-slate-200 text-slate-400'
                          }`}
                        >
                          {m === MeetingMode.OFFLINE && <MapPin size={28} className="mb-3" />}
                          {m === MeetingMode.ONLINE && <Video size={28} className="mb-3" />}
                          {m === MeetingMode.MIXED && <Users size={28} className="mb-3" />}
                          <span className="font-black text-sm uppercase tracking-wider">{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议全称</label>
                      <input 
                        placeholder="请输入正式公文标题..." 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase tracking-widest">召开时间</label>
                      <input 
                        type="datetime-local" 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                      />
                    </div>
                    {(mode === MeetingMode.OFFLINE || mode === MeetingMode.MIXED) && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest">会议地点</label>
                        <input 
                          placeholder="例如：综合楼 A座 403 决策会议室" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full animate-in fade-in duration-300">
                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center justify-between px-2">
                      <span>通讯录/组织架构</span>
                      <span className="text-[10px] text-slate-400 normal-case font-medium">点击部门批量选择</span>
                    </h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2rem] bg-slate-50/30 p-6 custom-scrollbar">
                      {Object.entries(groupedContacts).map(([dept, deptContacts]) => {
                        const isExpanded = expandedDepts.includes(dept);
                        const selectedInDept = selectedParticipants.filter(p => deptContacts.find(c => c.id === p.contactId));
                        const isAllSelected = selectedInDept.length === deptContacts.length && deptContacts.length > 0;
                        const isSomeSelected = selectedInDept.length > 0 && !isAllSelected;

                        return (
                          <div key={dept} className="mb-4">
                            <div className="flex items-center gap-3 p-3 hover:bg-white rounded-2xl transition-all group">
                              <button onClick={() => toggleDeptSelection(dept)} className="text-blue-600 transition-transform active:scale-90">
                                {isAllSelected ? <CheckSquare size={20} /> : isSomeSelected ? <CheckSquare size={20} className="opacity-50" /> : <Square size={20} className="text-slate-300" />}
                              </button>
                              <div className="flex-1 flex items-center gap-2 cursor-pointer" onClick={() => setExpandedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])}>
                                <Folder size={18} className="text-amber-500 fill-amber-500/20" />
                                <span className="font-bold text-slate-700">{dept}</span>
                                <span className="text-[10px] text-slate-400 font-bold ml-auto">{deptContacts.length}人</span>
                                <ChevronDown size={14} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="ml-8 mt-2 space-y-2 border-l-2 border-slate-100 pl-4 py-1">
                                {deptContacts.map(c => {
                                  const isSelected = selectedParticipants.find(p => p.contactId === c.id);
                                  return (
                                    <div 
                                      key={c.id} 
                                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-100/50'}`}
                                      onClick={() => toggleParticipant(c.id)}
                                    >
                                      {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-300" />}
                                      <User size={14} className="text-slate-400" />
                                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{c.name}</span>
                                      <span className="text-[10px] text-slate-400">{c.position}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">已选名单 ({selectedParticipants.length})</h4>
                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[2rem] bg-blue-50/20 p-6 space-y-3 custom-scrollbar">
                      {selectedParticipants.map(p => {
                        const contact = contacts.find(c => c.id === p.contactId);
                        if (!contact) return null;
                        return (
                          <div key={p.contactId} className="bg-white p-4 rounded-2xl border border-blue-100/50 flex items-center justify-between shadow-sm animate-in zoom-in-95">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-200">
                                {contact.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-800">{contact.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{contact.dept} · {contact.position}</p>
                              </div>
                            </div>
                            <button onClick={() => toggleParticipant(p.contactId)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        );
                      })}
                      {selectedParticipants.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-50">
                           <Users size={48} className="animate-bounce" />
                           <p className="font-bold">请从左侧通讯录勾选参会人员</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-300">
                  <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white flex items-start gap-8 shadow-2xl shadow-blue-500/20">
                    <Info size={40} className="shrink-0" />
                    <div>
                      <h4 className="text-2xl font-black mb-2">通知合规性自检</h4>
                      <p className="text-blue-100 leading-relaxed font-medium">
                        系统已根据会议模式（{mode}）和参会者属性（{selectedParticipants.length}人）自动匹配了差异化模板。
                        特别针对带有“采购属性”的人员，请核实其特定的采购方式和预算。
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedParticipants.some(p => contacts.find(c => c.id === p.contactId)?.isProcurement) ? (
                      selectedParticipants.filter(p => contacts.find(c => c.id === p.contactId)?.isProcurement).map(p => {
                        const contact = contacts.find(c => c.id === p.contactId);
                        return (
                          <div key={p.contactId} className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <Users size={24} />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-slate-800">{contact?.name} <span className="text-amber-600">(采购业务专家)</span></h4>
                                <p className="text-xs text-slate-400 font-bold">需要补充特定的采购评审字段</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">拟定采购方式</label>
                                <select 
                                  className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                                  value={p.procurementInfo?.method || ''}
                                  onChange={(e) => updateProcurementInfo(p.contactId, e.target.value, p.procurementInfo?.budget || '')}
                                >
                                  <option value="">请选择方式...</option>
                                  <option value="单一来源">单一来源</option>
                                  <option value="公开招标">公开招标</option>
                                  <option value="竞争性谈判">竞争性谈判</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">项目预算 (万元)</label>
                                <input 
                                  placeholder="0.00" 
                                  className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" 
                                  value={p.procurementInfo?.budget || ''} 
                                  onChange={(e) => updateProcurementInfo(p.contactId, p.procurementInfo?.method || '', e.target.value)} 
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                        <CheckSquare size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">本次参会人员不涉及特殊采购属性，无需额外配置</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-[3rem]">
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="px-8 py-3 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
              >
                取消
              </button>
              <div className="flex items-center space-x-4">
                {activeStep > 1 && (
                  <button 
                    onClick={() => setActiveStep(prev => prev - 1)} 
                    className="px-8 py-3 border-2 border-slate-200 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all"
                  >
                    上一步
                  </button>
                )}
                {activeStep < 3 ? (
                  <button 
                    onClick={() => setActiveStep(prev => prev + 1)} 
                    disabled={activeStep === 1 && !subject}
                    className="px-12 py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
                  >
                    下一步
                  </button>
                ) : (
                  <button 
                    onClick={handleCreateOrUpdate} 
                    className="px-16 py-3 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    {editingTaskId ? '更新任务' : '保存并生成通知'}
                  </button>
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
