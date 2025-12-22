
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Loader2,
  AlertCircle,
  SkipForward,
  Calendar,
  Check,
  Copy,
  MessageSquare,
  Users as UsersIcon,
  MessageCircle
} from 'lucide-react';
import { Contact, MeetingTask } from '../types';

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
    datePart = `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? "上午" : "下午";
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes}`;
  
  return {
    full: `${datePart}${period}${timeFormatted}`,
    dateOnly: `${datePart}`,
    timeOnly: timeFormatted
  };
};

const ExecutionConsole: React.FC<Props> = ({ tasks, setTasks, contacts }) => {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isRpaOperating, setIsRpaOperating] = useState(false);
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
      .sort((a, b) => b.count - a.count);
  }, [tasks, contacts]);

  useEffect(() => {
    if (sortedQueue.length > 0 && !activeContactId) {
      setActiveContactId(sortedQueue[0].contact.id);
    }
  }, [sortedQueue]);

  const currentItem = useMemo(() => {
    return sortedQueue.find(q => q.contact.id === activeContactId);
  }, [activeContactId, sortedQueue]);

  const participantsNames = useMemo(() => {
    if (!currentItem) return "";
    return currentItem.tasks[0].participants
      .map(p => contacts.find(c => c.id === p.contactId)?.name)
      .filter(Boolean)
      .join(';');
  }, [currentItem, contacts]);

  useEffect(() => {
    if (!currentItem) return;

    const { contact, tasks: contactTasks } = currentItem;
    const t = contactTasks[0];
    const tInfo = formatSemanticTime(t.time);
    const surname = contact.name.charAt(0);
    const title = contact.position || '经理';

    let onlineInfo = "";
    if (t.meetingId || t.meetingLink) {
      onlineInfo = `参会方式为腾讯会议${t.meetingLink ? `，链接${t.meetingLink}` : ""}${t.meetingId ? `，ID：${t.meetingId}` : ""}`;
    }

    if (mode === 'wechat') {
      let content = `${surname}${title}您好，关于“${t.subject}”评审会议通知：\n【时间】${tInfo.full}\n`;
      if (t.location) content += `【地点】${t.location}\n`;
      if (onlineInfo) content += `【线上】${onlineInfo}\n`;
      content += `参会人员：${participantsNames.replace(/;/g, '、')}\n届时请您安排人员参加支持，谢谢。`;
      setEditableContent(content);
    } else {
      let content = `您好！${tInfo.full}${t.location ? `在${t.location}` : ""}召开“${t.subject}”评审会议，届时请您安排人员参加支持，谢谢！${onlineInfo} 参会人员：${participantsNames.replace(/;/g, '、')}。(联系人：技术办-张佳欣：3723/19200545192)`;
      setEditableContent(content);
    }
  }, [currentItem, mode, participantsNames]);

  const triggerRpa = async () => {
    if (!currentItem || mode !== 'wechat' || isRpaOperating) return;
    
    setIsRpaOperating(true);
    try {
      // 关键修复：确保传递的是 contact.wechatRemark 字段
      const searchRemark = currentItem.contact.wechatRemark;
      
      const response = await fetch(`http://localhost:5000/send_wechat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          remark: searchRemark, 
          content: editableContent 
        })
      });
      
      const resData = await response.json();
      if (resData.status === 'success') {
        setSentLog(prev => ({ ...prev, [activeContactId!]: true }));
      } else {
        alert(`RPA 失败: ${resData.message}`);
      }
    } catch (e) {
      alert("无法连接到 RPA 服务，请确保 bridge.py 正在运行且监听 5000 端口。");
    } finally {
      setIsRpaOperating(false);
    }
  };

  const handleNext = () => {
    const idx = sortedQueue.findIndex(q => q.contact.id === activeContactId);
    if (idx < sortedQueue.length - 1) setActiveContactId(sortedQueue[idx + 1].contact.id);
  };

  return (
    <div className="flex h-full gap-8 overflow-hidden">
      <div className="w-80 flex flex-col gap-6 shrink-0 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 overflow-hidden">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 px-2">
          <Calendar size={22} className="text-blue-600" />
          待发送队列
        </h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1">
          {sortedQueue.map(item => (
            <div 
              key={item.contact.id} 
              onClick={() => setActiveContactId(item.contact.id)}
              className={`p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                activeContactId === item.contact.id 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                : 'bg-slate-50 border-slate-50 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-lg truncate pr-2">{item.contact.name}</span>
                {sentLog[item.contact.id] && <Check size={18} className={activeContactId === item.contact.id ? 'text-white' : 'text-emerald-500'} />}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${activeContactId === item.contact.id ? 'text-blue-100' : 'text-slate-400'}`}>
                {item.contact.dept} · {item.tasks.length}条待发
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-8 border-slate-800">
        {currentItem ? (
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-slate-800/80 p-8 rounded-[2.5rem] border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {currentItem.contact.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white text-2xl font-black">{currentItem.contact.name}</h4>
                    <p className="text-slate-500 text-sm font-bold mt-1">
                      微信备注：<span className="text-blue-400 font-black">{currentItem.contact.wechatRemark}</span> | 手机：{currentItem.contact.phone}
                    </p>
                  </div>
                </div>
                <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
                  <button onClick={() => setMode('wechat')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${mode === 'wechat' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    <MessageCircle size={14}/> 微信模式
                  </button>
                  <button onClick={() => setMode('sms')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${mode === 'sms' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    <MessageSquare size={14}/> 短信模式
                  </button>
                </div>
              </div>

              {mode === 'wechat' ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">微信通知正文 (RPA 将精准搜索备注：{currentItem.contact.wechatRemark})</label>
                  </div>
                  <textarea 
                    value={editableContent} 
                    onChange={e => setEditableContent(e.target.value)} 
                    className="w-full h-80 bg-slate-800/40 border-2 border-slate-700 rounded-[2.5rem] p-8 text-slate-100 text-xl font-bold leading-relaxed outline-none focus:border-blue-500 transition-all custom-scrollbar" 
                  />
                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <button 
                      onClick={triggerRpa} 
                      disabled={isRpaOperating}
                      className="h-20 bg-blue-600 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-blue-500 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {isRpaOperating ? <Loader2 className="animate-spin" size={28} /> : <Play size={28} />}
                      {isRpaOperating ? '自动化执行中...' : '查找备注并粘贴'}
                    </button>
                    <button onClick={handleNext} className="h-20 bg-slate-800 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-slate-700 transition-all shadow-lg">
                      <SkipForward size={28} />
                      跳过/下一个
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 短信模式保持原样 */}
                  <div className="bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-700">
                    <p className="text-slate-400 font-bold mb-4">短信通知内容：</p>
                    <p className="text-white text-lg leading-relaxed">{editableContent}</p>
                  </div>
                  <button onClick={handleNext} className="w-full h-20 bg-slate-800 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-slate-700 transition-all">
                    <SkipForward size={28} /> 处理完毕，下一个
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-6">
             <AlertCircle size={80} className="opacity-10" />
             <p className="text-3xl font-black opacity-30">发送队列已清空</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionConsole;
