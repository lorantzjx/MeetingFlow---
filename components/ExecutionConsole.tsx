
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
  FileText
} from 'lucide-react';
import { Contact, MeetingTask, Position, MeetingMode } from '../types';

interface Props {
  tasks: MeetingTask[];
  setTasks: React.Dispatch<React.SetStateAction<MeetingTask[]>>;
  contacts: Contact[];
}

// 语义化日期格式化工具 - 修正下午时间显示为 24 小时制
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
    datePart = `下周${weeks[date.getDay()]}`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? "上午" : "下午";
  
  // 修改点：直接使用 hours 实现 24 小时制（如下午 14:00）
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes}`;
  
  return {
    full: `${datePart}（${month}月${day}日）${period}${timeFormatted}`,
    period: period,
    dateOnly: `${datePart}（${month}月${day}日）`,
    timeOnly: timeFormatted
  };
};

const ExecutionConsole: React.FC<Props> = ({ tasks, setTasks, contacts }) => {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isRpaOperating, setIsRpaOperating] = useState(false);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [mode, setMode] = useState<'wechat' | 'sms'>('wechat');
  const [editableContent, setEditableContent] = useState('');
  const [sentLog, setSentLog] = useState<Record<string, boolean>>({});

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
      const depts: Record<string, Contact[]> = {};
      task.participants.forEach(p => {
        const c = contacts.find(contact => contact.id === p.contactId);
        if (c) {
          if (!depts[c.dept]) depts[c.dept] = [];
          depts[c.dept].push(c);
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

  useEffect(() => {
    const current = sortedQueue.find(q => q.contact.id === activeContactId);
    if (!current) return;

    const { contact, tasks: contactTasks } = current;
    const timeInfo = formatSemanticTime(contactTasks[0].time);
    const surname = contact.name.charAt(0); // 取姓名第一个字作为【姓】
    const title = contact.position === Position.NONE ? '经理' : contact.position;

    if (contactTasks.length > 1) {
      let content = `${surname}${title}您好，${timeInfo.dateOnly}${timeInfo.period}在${contactTasks[0].location}有两个评审，届时请您安排人员参加支持：\n`;
      contactTasks.forEach((t, i) => {
        const tInfo = formatSemanticTime(t.time);
        const pStatus = t.participants.find(p => p.contactId === contact.id);
        content += `${i + 1}、时间${tInfo.timeOnly}，“${t.subject}”评审${pStatus?.procurementInfo ? `，涉及${pStatus.procurementInfo.method}，预算${pStatus.procurementInfo.budget}万元` : ''}\n`;
      });
      setEditableContent(content.trim());
    } else {
      const t = contactTasks[0];
      const tInfo = formatSemanticTime(t.time);
      const pStatus = t.participants.find(p => p.contactId === contact.id);
      
      if (mode === 'wechat') {
        let content = `${surname}${title}您好，${tInfo.full}在${t.location || '线上'}召开“${t.subject}”评审会议，届时请您安排人员参加支持。`;
        if (contact.isProcurement && pStatus?.procurementInfo) {
          content += `涉及招标采购，预算${pStatus.procurementInfo.budget}万元。`;
        }
        setEditableContent(content);
      } else {
        const smsContent = `您好！${tInfo.full}在${t.location || '线上'}召开“${t.subject}”评审会议，届时请您安排人员参加支持。(联系人：技术办-${t.contactPerson} ${t.contactPhone})`;
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
              {Object.entries(depts).map(([deptName, deptContacts]) => (
                <div key={deptName} className="pl-2 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Building2 size={12} />
                    <span className="text-[10px] font-bold">{deptName}</span>
                  </div>
                  {deptContacts.map(c => {
                    const isActive = activeContactId === c.id;
                    return (
                      <div key={c.id} onClick={() => setActiveContactId(c.id)} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}>
                        <span className="text-xs font-medium">{c.name}</span>
                        {sentLog[c.id] && <Check size={12} className={isActive ? 'text-white' : 'text-emerald-500'} />}
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
        {!bridgeConnected && <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center text-white p-8"><AlertCircle size={48} className="text-red-500 mb-4" /><h3 className="text-xl font-bold">RPA 未连接</h3></div>}
        {currentItem ? (
          <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black">{currentItem.contact.name.charAt(0)}</div>
                  <div>
                    <h4 className="text-white text-xl font-bold">{currentItem.contact.name} ({currentItem.contact.wechatRemark})</h4>
                    <p className="text-slate-500 text-sm">部门：{currentItem.contact.dept}</p>
                  </div>
                </div>
                
                {/* 文件预览 */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">待发送文件清单</p>
                  <div className="flex flex-wrap gap-2">
                    {currentFiles.map(f => (
                      <div key={f} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-xs text-blue-300 border border-blue-900/30">
                        <FileText size={14} />
                        {f}
                      </div>
                    ))}
                    {currentFiles.length === 0 && <span className="text-xs text-slate-600 italic">无附件</span>}
                  </div>
                </div>
              </div>

              <textarea value={editableContent} onChange={e => setEditableContent(e.target.value)} className="w-full h-72 bg-slate-800/40 border border-slate-700 rounded-[2rem] p-10 text-slate-100 text-xl outline-none" />

              <div className="grid grid-cols-2 gap-6">
                <button onClick={triggerRpa} className="h-20 bg-blue-600 text-white rounded-[1.5rem] font-bold text-xl flex items-center justify-center gap-3">
                  {isRpaOperating ? <Loader2 className="animate-spin" /> : <Play size={24} />}
                  执行微信填充
                </button>
                <button onClick={handleNext} className="h-20 bg-slate-800 text-white rounded-[1.5rem] font-bold text-xl flex items-center justify-center gap-3">
                  <SkipForward size={24} />
                  跳过此人
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ExecutionConsole;
