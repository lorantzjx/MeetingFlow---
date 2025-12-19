
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
  Check
} from 'lucide-react';
import { Contact, MeetingTask, Position, MeetingMode } from '../types';

interface Props {
  tasks: MeetingTask[];
  setTasks: React.Dispatch<React.SetStateAction<MeetingTask[]>>;
  contacts: Contact[];
}

// 语义化日期格式化工具
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
  
  return {
    full: `${datePart}（${month}月${day}日）${period}${hours % 12 || 12}:${minutes}`,
    period: period,
    dateOnly: `${datePart}（${month}月${day}日）`,
    timeOnly: `${hours % 12 || 12}:${minutes}`
  };
};

const ExecutionConsole: React.FC<Props> = ({ tasks, setTasks, contacts }) => {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isRpaOperating, setIsRpaOperating] = useState(false);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [mode, setMode] = useState<'wechat' | 'sms'>('wechat');
  const [editableContent, setEditableContent] = useState('');
  const [sentLog, setSentLog] = useState<Record<string, boolean>>({}); // contactId -> isSent

  // 1. 核心计算：优先级排序队列 (先单会，后多会)
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
      .sort((a, b) => a.count - b.count); // 升序排序：1个会议的在前，多个的在后
  }, [tasks, contacts]);

  // 2. 左侧看板：按会议分组数据
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

  // 初始化选择
  useEffect(() => {
    if (sortedQueue.length > 0 && !activeContactId) {
      setActiveContactId(sortedQueue[0].contact.id);
    }
  }, [sortedQueue]);

  // 检查 RPA 桥接
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

  // 文案生成逻辑
  useEffect(() => {
    const current = sortedQueue.find(q => q.contact.id === activeContactId);
    if (!current) return;

    const { contact, tasks: contactTasks } = current;
    const timeInfo = formatSemanticTime(contactTasks[0].time);
    const surname = contact.name.charAt(0);
    const title = contact.position === Position.NONE ? '经理' : contact.position;

    if (contactTasks.length > 1) {
      // 多会议合并
      let content = `${contact.name}${title}您好，${timeInfo.dateOnly}${timeInfo.period}在${contactTasks[0].location}有两个评审，届时请您安排人员参加支持：\n`;
      contactTasks.forEach((t, i) => {
        const tInfo = formatSemanticTime(t.time);
        const pStatus = t.participants.find(p => p.contactId === contact.id);
        content += `${i + 1}、时间${tInfo.timeOnly}，“${t.subject}”评审${pStatus?.procurementInfo ? `，涉及${pStatus.procurementInfo.method}，预算${pStatus.procurementInfo.budget}万元` : ''}\n`;
      });
      setEditableContent(content.trim());
    } else {
      // 单会议
      const t = contactTasks[0];
      const tInfo = formatSemanticTime(t.time);
      const pStatus = t.participants.find(p => p.contactId === contact.id);
      
      if (mode === 'wechat') {
        let content = `${contact.name}${title}您好，${tInfo.full}在${t.location || '线上'}召开“${t.subject}”评审会议，届时请您安排人员参加支持。`;
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

  const triggerRpa = async () => {
    if (!bridgeConnected || !currentItem) return;
    setIsRpaOperating(true);
    try {
      const endpoint = mode === 'wechat' ? 'send_wechat' : 'fill_sms_web';
      const body = mode === 'wechat' 
        ? { remark: currentItem.contact.wechatRemark, content: editableContent }
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
      {/* 左侧：会议清单看板 */}
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
                    const isMulti = (sortedQueue.find(q => q.contact.id === c.id)?.count || 0) > 1;
                    const isSent = sentLog[c.id];
                    const isActive = activeContactId === c.id;
                    return (
                      <div 
                        key={c.id}
                        onClick={() => setActiveContactId(c.id)}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 
                          isSent ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium">{c.name}</span>
                          {isMulti && <span className={`text-[8px] px-1 rounded ${isActive ? 'bg-white/20' : 'bg-orange-100 text-orange-600'}`}>多会</span>}
                        </div>
                        {isSent && <Check size={12} className={isActive ? 'text-white' : 'text-emerald-500'} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：执行区 */}
      <div className="flex-1 bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col border border-slate-800 relative overflow-hidden">
        {!bridgeConnected && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8">
            <AlertCircle size={48} className="text-red-500 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold">RPA 引擎未就绪</h3>
            <p className="text-slate-500 text-sm mt-2">请确保本地运行了 rpa_bridge.py 且 5000 端口可用</p>
          </div>
        )}

        {currentItem ? (
          <>
            <div className="px-10 py-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex bg-slate-800 p-1 rounded-2xl">
                <button onClick={() => setMode('wechat')} className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'wechat' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>微信模态</button>
                <button onClick={() => setMode('sms')} className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'sms' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>短信模态</button>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Priority Queue</p>
                <p className="text-blue-400 font-mono text-sm">
                  {currentItem.count === 1 ? '单会议优先' : '多会议聚合'} ({sortedQueue.findIndex(q => q.contact.id === activeContactId) + 1} / {sortedQueue.length})
                </p>
              </div>
            </div>

            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-10">
                {/* 状态卡片 */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-[2rem] border border-slate-700 flex items-center gap-8">
                  <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-600/20">
                    {currentItem.contact.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-white text-2xl font-bold">{currentItem.contact.name}</h4>
                      <span className="px-3 py-1 bg-slate-700 text-slate-400 rounded-lg text-xs font-bold uppercase tracking-wider">{currentItem.contact.dept}</span>
                    </div>
                    <p className="text-slate-500 mt-2 flex items-center gap-2">
                      <Users size={14} />
                      {currentItem.count > 1 ? `检测到 ${currentItem.count} 个重叠会议，文案已自动执行列表式聚合。` : '标准单场会议通知模式。'}
                    </p>
                  </div>
                  {sentLog[activeContactId!] && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-bold">
                       <CheckCircle size={14} /> 已填充
                    </div>
                  )}
                </div>

                {/* 编辑框 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <label className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                      <Edit3 size={14} className="text-blue-500" /> 人工复核区
                    </label>
                    <span className="text-[10px] opacity-50">支持键盘直接修改</span>
                  </div>
                  <textarea 
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full h-72 bg-slate-800/40 border border-slate-700 rounded-[2rem] p-10 text-slate-100 text-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans leading-relaxed shadow-inner"
                  />
                </div>

                {/* 动作 */}
                <div className="grid grid-cols-5 gap-6">
                  <button 
                    onClick={triggerRpa}
                    disabled={isRpaOperating}
                    className="col-span-3 h-24 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-bold shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isRpaOperating ? <Loader2 className="animate-spin" /> : <Play size={28} />}
                    <div className="text-left">
                      <p className="text-xl">开始自动化填充</p>
                      <p className="text-[10px] opacity-60">填充后请至软件窗口手动点击发送</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={handleNext}
                    className="col-span-2 h-24 bg-slate-800 hover:bg-slate-700 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-4 transition-all active:scale-95 border border-slate-700 shadow-xl"
                  >
                    <SkipForward size={28} />
                    <div className="text-left">
                      <p className="text-xl">跳过此人</p>
                      <p className="text-[10px] opacity-60">跳转至队列下一位</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
             <div className="w-32 h-32 bg-slate-800 rounded-[3rem] flex items-center justify-center mb-8">
               <UserCheck size={48} className="text-slate-600" />
             </div>
             <p className="text-xl font-bold text-slate-400">所有发送任务已处理完毕</p>
             <p className="text-sm mt-2 text-slate-500">点击左侧看板可重新查看或复核</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionConsole;
