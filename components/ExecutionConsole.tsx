
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Loader2,
  Edit3,
  AlertCircle,
  SkipForward,
  CheckCircle,
  UserCheck,
  Calendar,
  Building2,
  Users,
  Check,
  FileText,
  Copy,
  ClipboardCheck,
  Video,
  MapPin
} from 'lucide-react';
import { Contact, MeetingTask, MeetingMode, ParticipantMode } from '../types';

interface Props {
  tasks: MeetingTask[];
  setTasks: React.Dispatch<React.SetStateAction<MeetingTask[]>>;
  contacts: Contact[];
}

const formatSemanticTime = (dateStr: string) => {
  if (!dateStr) return { full: "", period: "", dateOnly: "", timeOnly: "" };
  const date = new Date(dateStr);
  const now = new Date();
  const dayDiff = Math.floor((date.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000 * 3600 * 24));
  
  let datePart = "";
  if (dayDiff === 0) datePart = "今天";
  else if (dayDiff === 1) datePart = "明天";
  else if (dayDiff === 2) datePart = "后天";
  else {
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    datePart = `${date.getMonth() + 1}月${date.getDate()}日(周${weeks[date.getDay()]})`;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? "上午" : "下午";
  const displayHours = hours > 12 ? hours - 12 : hours;
  
  const timeFormatted = `${displayHours}:${minutes}`;
  
  return {
    full: `${datePart}${period}${timeFormatted}`,
    period: period,
    dateOnly: datePart,
    timeOnly: timeFormatted
  };
};

const ExecutionConsole: React.FC<Props> = ({ tasks, setTasks, contacts }) => {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isRpaOperating, setIsRpaOperating] = useState(false);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [mode, setMode] = useState<'wechat' | 'sms'>('wechat');
  const [editableContent, setEditableContent] = useState('');
  const [participantListText, setParticipantListText] = useState('');
  const [sentLog, setSentLog] = useState<Record<string, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const sortedQueue = useMemo(() => {
    const contactTasksMap = new Map<string, MeetingTask[]>();
    tasks.filter(t => t.status !== 'completed').forEach(task => {
      task.participants.forEach(p => {
        if (!contactTasksMap.has(p.contactId)) contactTasksMap.set(p.contactId, []);
        contactTasksMap.get(p.contactId)?.push(task);
      });
    });

    return Array.from(contactTasksMap.entries())
      .map(([id, tks]) => ({
        contact: contacts.find(c => c.id === id)!,
        tasks: tks,
        count: tks.length
      }))
      .filter(item => item.contact)
      .sort((a, b) => a.count - b.count);
  }, [tasks, contacts]);

  const meetingGroups = useMemo(() => {
    return tasks.filter(t => t.status !== 'completed').map(task => {
      const depts: Record<string, { contact: Contact, pStatus: any }[]> = {};
      task.participants.forEach(p => {
        const c = contacts.find(contact => contact.id === p.contactId);
        if (c) {
          if (!depts[c.dept]) depts[c.dept] = [];
          depts[c.dept].push({ contact: c, pStatus: p });
        }
      });
      return { task, depts };
    });
  }, [tasks, contacts]);

  useEffect(() => {
    if (sortedQueue.length > 0 && !activeContactId) {
      setActiveContactId(sortedQueue[0].contact.id);
    }
  }, [sortedQueue]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/status');
        setBridgeConnected(res.ok);
      } catch { setBridgeConnected(false); }
    };
    check();
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(id);
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      alert('复制失败，请手动选择复制');
    }
  };

  useEffect(() => {
    const current = sortedQueue.find(q => q.contact.id === activeContactId);
    if (!current) return;

    const { contact, tasks: contactTasks } = current;
    const task = contactTasks[0];
    const pStatus = task.participants.find(p => p.contactId === contact.id);
    const timeInfo = formatSemanticTime(task.time);
    const surname = contact.name.charAt(0);
    const title = contact.position === '无' ? '经理' : contact.position;

    // 获取当前会议的所有参会人员姓名列表
    const pNames = task.participants
      .map(p => contacts.find(c => c.id === p.contactId)?.name)
      .filter(Boolean)
      .join('、');
    setParticipantListText(pNames);

    if (contactTasks.length > 1) {
      // 多会议合并逻辑
      let content = `${surname}${title}您好，${timeInfo.dateOnly}${timeInfo.period}您有${contactTasks.length}个评审会议需要支持，详情如下：\n`;
      contactTasks.forEach((t, i) => {
        const tInfo = formatSemanticTime(t.time);
        const tpStatus = t.participants.find(p => p.contactId === contact.id);
        const isOnline = tpStatus?.mode === ParticipantMode.ONLINE;
        
        content += `${i + 1}、${tInfo.timeOnly} “${t.subject}”评审\n`;
        content += `   【方式】${isOnline ? '在线会议' : '线下：' + (t.location || '待定')}\n`;
        if (isOnline) {
          if (t.meetingId) content += `   【ID】${t.meetingId}\n`;
        }
        if (tpStatus?.procurementInfo) {
          content += `   【招标】涉及${tpStatus.procurementInfo.method}，预算${tpStatus.procurementInfo.budget}万元\n`;
        }
      });
      content += `届时请您准时参加或安排相关人员参加，谢谢。`;
      setEditableContent(content.trim());
    } else {
      // 单个会议逻辑
      const isOnline = pStatus?.mode === ParticipantMode.ONLINE;
      
      if (mode === 'wechat') {
        let content = `${surname}${title}您好，${timeInfo.full}`;
        
        if (isOnline) {
          // 线上话术
          content += `在线召开（视频会议）：“${task.subject}”评审会议，届时请您安排人员参加支持，谢谢！`;
          content += `\n参会方式为腾讯会议，点击链接直接加入会议：${task.meetingLink || '待提供'}`;
          if (task.meetingId) content += `\n会议ID：${task.meetingId}`;
        } else {
          // 线下话术
          content += `在${task.location || '指定地点'}召开“${task.subject}”评审会议，届时请您安排人员参加支持。`;
        }

        if (contact.isProcurement && pStatus?.procurementInfo) {
          content += `\n涉及招标采购，评审方式：${pStatus.procurementInfo.method}，预算${pStatus.procurementInfo.budget}万元。`;
        }
        setEditableContent(content);
      } else {
        // 短信模式简化话术
        const smsContent = `您好！${timeInfo.full}${isOnline ? '在线' : '在' + task.location}召开“${task.subject}”评审会议，届时请您参加或安排人员参加支持。(联系人：${task.contactPerson} ${task.contactPhone})`;
        setEditableContent(smsContent);
      }
    }
  }, [activeContactId, sortedQueue, mode]);

  const currentItem = sortedQueue.find(q => q.contact.id === activeContactId);
  const currentParticipant = currentItem?.tasks[0].participants.find(p => p.contactId === activeContactId);
  const currentFiles = currentParticipant?.useDefaultFiles 
    ? currentItem?.tasks[0].attachments || []
    : currentParticipant?.customFiles || [];

  const triggerRpa = async () => {
    if (!bridgeConnected || !currentItem) return;
    setIsRpaOperating(true);
    try {
      const endpoint = mode === 'wechat' ? 'send_wechat' : 'fill_sms_web';
      const body = mode === 'wechat' 
        ? { remark: currentItem.contact.wechatRemark, content: editableContent, files: currentFiles }
        : { url: 'https://sms-platform.example.com', content: editableContent, phones: currentItem.contact.phone };
      
      await fetch(`http://127.0.0.1:5000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      setSentLog(prev => ({ ...prev, [activeContactId!]: true }));
    } catch (e) {
      alert('RPA 执行失败');
    } finally {
      setIsRpaOperating(false);
    }
  };

  const handleNext = () => {
    const idx = sortedQueue.findIndex(q => q.contact.id === activeContactId);
    if (idx < sortedQueue.length - 1) {
      setActiveContactId(sortedQueue[idx + 1].contact.id);
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      <div className="w-80 flex flex-col gap-4 shrink-0 overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-blue-600" />
          发送清单看板
        </h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
          {meetingGroups.map(({ task, depts }) => (
            <div key={task.id} className="space-y-3">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">会议任务</p>
                <p className="text-xs font-bold text-slate-700 truncate">{task.subject}</p>
              </div>
              {Object.entries(depts).map(([deptName, items]) => (
                <div key={deptName} className="pl-2 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Building2 size={12} />
                    <span className="text-[10px] font-bold">{deptName}</span>
                  </div>
                  {items.map(({ contact, pStatus }) => {
                    const isActive = activeContactId === contact.id;
                    const isOnline = pStatus.mode === ParticipantMode.ONLINE;
                    return (
                      <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-xs font-medium truncate">{contact.name}</span>
                          {isOnline ? (
                            <Video size={10} className={isActive ? 'text-blue-200' : 'text-indigo-500'} />
                          ) : (
                            <MapPin size={10} className={isActive ? 'text-blue-200' : 'text-amber-500'} />
                          )}
                        </div>
                        {sentLog[contact.id] && <Check size={12} className={isActive ? 'text-white' : 'text-emerald-500'} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col border border-slate-800 relative overflow-hidden">
        {!bridgeConnected && (
          <div className="absolute top-4 right-4 z-10">
            <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
              <AlertCircle size={14} /> RPA 未连接
            </div>
          </div>
        )}

        <div className="h-20 shrink-0 border-b border-white/5 flex items-center justify-center p-4">
          <div className="bg-white/5 p-1.5 rounded-2xl flex">
            <button onClick={() => setMode('wechat')} className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${mode === 'wechat' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              微信模式
            </button>
            <button onClick={() => setMode('sms')} className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${mode === 'sms' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              短信模式
            </button>
          </div>
        </div>

        {currentItem ? (
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black ${currentParticipant?.mode === ParticipantMode.ONLINE ? 'bg-indigo-600' : 'bg-amber-500'}`}>
                    {currentParticipant?.mode === ParticipantMode.ONLINE ? <Video size={24} /> : <MapPin size={24} />}
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-bold">
                      {currentItem.contact.name} ({currentItem.contact.wechatRemark})
                      <span className={`ml-3 px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${currentParticipant?.mode === ParticipantMode.ONLINE ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {currentParticipant?.mode}
                      </span>
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 font-mono">{currentItem.contact.phone}</p>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2 max-w-xs justify-end">
                    {currentFiles.map(f => (
                      <div key={f} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg text-[10px] text-blue-400 border border-blue-500/10">
                        <FileText size={10} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="relative group">
                  <label className="absolute left-6 -top-3 px-3 bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest z-10 border border-white/5 rounded-full">
                    {mode === 'wechat' ? '微信通知预览 (基于参会模式自动适配)' : '短信内容预览'}
                  </label>
                  <textarea 
                    value={editableContent} 
                    onChange={e => setEditableContent(e.target.value)} 
                    className="w-full h-80 bg-slate-800/20 border border-white/10 rounded-[2.5rem] p-10 text-slate-100 text-lg outline-none focus:border-blue-500/50 focus:bg-slate-800/40 transition-all font-medium leading-relaxed" 
                  />
                  <button 
                    onClick={() => copyToClipboard(editableContent, 'main')}
                    className="absolute bottom-6 right-6 p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5"
                  >
                    {copyStatus === 'main' ? <ClipboardCheck className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>
                
                {mode === 'sms' && (
                   <div className="relative group">
                     <label className="mb-2 px-3 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                       <span>全员名单 (用于核对)</span>
                       <button 
                         onClick={() => copyToClipboard(participantListText, 'plist')}
                         className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 border border-white/5"
                       >
                          {copyStatus === 'plist' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>复制名单</span>
                       </button>
                     </label>
                     <textarea 
                       value={participantListText} 
                       readOnly
                       className="w-full h-24 bg-slate-800/40 border border-white/10 rounded-[1.5rem] p-6 text-slate-400 text-sm outline-none font-mono" 
                     />
                   </div>
                )}

                <button onClick={triggerRpa} disabled={isRpaOperating || !bridgeConnected} className="w-full h-20 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 disabled:hover:bg-blue-600 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 transition-all active:scale-95">
                  {isRpaOperating ? <Loader2 className="animate-spin" /> : <Play size={24} />}
                  {isRpaOperating ? 'RPA 正在启动中...' : `启动${mode === 'wechat' ? '微信' : '短信'} RPA 自动化`}
                </button>
              </div>

              <div className="flex items-center justify-between pt-6">
                <button onClick={handleNext} className="h-16 px-10 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-3 transition-all">
                  <SkipForward size={20} />
                  跳过当前人员
                </button>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                  Queue progress: {sortedQueue.findIndex(q => q.contact.id === activeContactId) + 1} / {sortedQueue.length}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
            <CheckCircle size={64} className="opacity-10" />
            <p className="font-bold text-lg uppercase tracking-widest">目前没有待处理的发送任务</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionConsole;
