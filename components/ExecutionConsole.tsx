
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Loader2,
  SkipForward,
  CheckCircle,
  Building2,
  Copy,
  ClipboardCheck,
  Layers,
  Link as LinkIcon,
  Unlink,
  Users
} from 'lucide-react';
import { Contact, MeetingTask, MeetingMode, Template } from '../types.ts';
import { DEFAULT_WECHAT_PATH } from '../constants.ts';

interface Props {
  tasks: MeetingTask[];
  setTasks: React.Dispatch<React.SetStateAction<MeetingTask[]>>;
  contacts: Contact[];
  settingsTemplates: Template[];
}

const formatSemanticTime = (dateStr: string) => {
  if (!dateStr) return { full: "", dateOnly: "", timeOnly: "" };
  const date = new Date(dateStr);
  const now = new Date();
  const dayDiff = Math.floor((date.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000 * 3600 * 24));
  
  let datePart = "";
  if (dayDiff === 0) datePart = "今天";
  else if (dayDiff === 1) datePart = "明天";
  else if (dayDiff === 2) datePart = "后天";
  else {
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    datePart = `${date.getMonth() + 1}月${date.getDate()}日 (周${weeks[date.getDay()]})`;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes}`;
  
  return {
    full: `${datePart}${timeFormatted}`,
    dateOnly: datePart,
    timeOnly: timeFormatted
  };
};

const ExecutionConsole: React.FC<Props> = ({ tasks, setTasks, contacts, settingsTemplates }) => {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isRpaOperating, setIsRpaOperating] = useState(false);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [mode, setMode] = useState<'wechat' | 'sms'>('wechat');
  const [editableContent, setEditableContent] = useState('');
  const [participantListText, setParticipantListText] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const sortedQueue = useMemo(() => {
    const contactTasksMap = new Map<string, MeetingTask[]>();
    const contactSentStatus = new Map<string, boolean>();

    tasks.filter(t => t.status !== 'completed').forEach(task => {
      task.participants.forEach(p => {
        if (!contactTasksMap.has(p.contactId)) contactTasksMap.set(p.contactId, []);
        contactTasksMap.get(p.contactId)?.push(task);
        if (p.isSent) contactSentStatus.set(p.contactId, true);
      });
    });

    return Array.from(contactTasksMap.entries())
      .map(([id, tks]) => ({
        contact: contacts.find(c => c.id === id)!,
        tasks: tks,
        count: tks.length,
        isSent: contactSentStatus.get(id) || false
      }))
      .filter(item => item.contact)
      .sort((a, b) => b.count - a.count);
  }, [tasks, contacts]);

  useEffect(() => {
    if (sortedQueue.length > 0 && !activeContactId) {
      setActiveContactId(sortedQueue[0].contact.id);
    }
  }, [sortedQueue, activeContactId]);

  // 检查桥接状态
  const checkBridge = async () => {
    try {
      const res = await fetch('http://localhost:5000/ping');
      if (res.ok) setBridgeConnected(true);
    } catch (e) {
      setBridgeConnected(false);
      alert('无法连接到本地 RPA 引擎。请确保 Python 脚本已在 PyCharm 中运行。');
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(id);
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) { console.error('复制失败'); }
  };

  useEffect(() => {
    const current = sortedQueue.find(q => q.contact.id === activeContactId);
    if (!current) return;

    const { contact, tasks: contactTasks } = current;
    const isMulti = contactTasks.length > 1;

    const allParticipants = contactTasks[0].participants
      .map(p => contacts.find(c => c.id === p.contactId)?.name)
      .filter(Boolean)
      .join('、');
    setParticipantListText(allParticipants);

    let template: Template | undefined;
    if (isMulti) {
      template = settingsTemplates.find(t => t.type === 'multi');
    } else {
      const task = contactTasks[0];
      const pStatus = task.participants.find(p => p.contactId === contact.id);
      const preferredTemplateId = pStatus?.templateId || task.defaultTemplateId;
      template = settingsTemplates.find(t => t.id === preferredTemplateId);
      
      if (!template) {
        const modeSuffix = task.mode === MeetingMode.ONLINE ? 'online' : 'offline';
        template = settingsTemplates.find(t => t.id === `${mode}-${modeSuffix}`) || settingsTemplates.find(t => t.type === mode);
      }
    }

    if (!template) {
      setEditableContent('未找到对应模板，请在设置中配置。');
      return;
    }

    let content = template.content;
    const replaceTags = (text: string, t: MeetingTask) => {
      const tInfo = formatSemanticTime(t.time);
      const ps = t.participants.find(p => p.contactId === contact.id);
      return text
        .replace(/{{姓名}}/g, contact.name)
        .replace(/{{姓}}/g, contact.name.charAt(0)) 
        .replace(/{{职务}}/g, contact.position === '无' ? '经理' : contact.position)
        .replace(/{{时间}}/g, tInfo.full)
        .replace(/{{日期}}/g, tInfo.dateOnly)
        .replace(/{{主题}}/g, t.subject)
        .replace(/{{地点}}/g, t.location || '线上会议')
        .replace(/{{会议号}}/g, t.meetingId || '无')
        .replace(/{{会议链接}}/g, t.meetingLink || '无')
        .replace(/{{联系人}}/g, t.contactPerson)
        .replace(/{{联系电话}}/g, t.contactPhone)
        .replace(/{{采购方式}}/g, ps?.procurementInfo?.method || '不涉及')
        .replace(/{{预算}}/g, ps?.procurementInfo?.budget || '0');
    };

    if (isMulti) {
      const firstTaskInfo = formatSemanticTime(contactTasks[0].time);
      content = content.replace(/{{日期}}/g, firstTaskInfo.dateOnly);
      const listText = contactTasks.map((t, i) => {
        const info = formatSemanticTime(t.time);
        return `${i + 1}. ${info.timeOnly} “${t.subject}”`;
      }).join('\n');
      content = content.replace(/{{会议列表}}/g, listText);
      content = replaceTags(content, contactTasks[0]);
    } else {
      content = replaceTags(content, contactTasks[0]);
    }

    setEditableContent(content);
  }, [activeContactId, sortedQueue, mode, settingsTemplates, contacts]);

  const currentItem = sortedQueue.find(q => q.contact.id === activeContactId);
  
  // 核心功能实现：调用 Python RPA 后端
  const handleStartAutomation = async () => {
    if (!activeContactId || !currentItem) return;

    if (!bridgeConnected) {
      alert(`⚠️ 请先运行 Python 脚本并连接 RPA 桥接。`);
      return;
    }

    setIsRpaOperating(true);

    try {
      const response = await fetch('http://localhost:5000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exePath: DEFAULT_WECHAT_PATH,
          targetUser: currentItem.contact.wechatRemark,
          content: editableContent
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // 更新 UI 状态为已发送
        setTasks(prev => prev.map(task => {
          if (currentItem.tasks.some(t => t.id === task.id)) {
            return {
              ...task,
              participants: task.participants.map(p => 
                p.contactId === activeContactId ? { ...p, isSent: true } : p
              )
            };
          }
          return task;
        }));
      } else {
        alert('RPA 执行出错: ' + result.message);
      }
    } catch (err) {
      alert('无法连接到 RPA 服务，请检查后端是否关闭。');
    } finally {
      setIsRpaOperating(false);
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden animate-in fade-in duration-500">
      <div className="w-80 flex flex-col gap-4 shrink-0 overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            发送清单看板
          </h3>
          <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-bold">{sortedQueue.length} 组</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {sortedQueue.length === 0 ? (
            <div className="py-20 text-center space-y-4 opacity-40">
              <CheckCircle size={40} className="mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest">暂无待办通知</p>
            </div>
          ) : (
            Array.from(new Set(sortedQueue.map(q => q.contact.dept))).map(deptName => (
              <div key={deptName} className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <Building2 size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{deptName}</span>
                </div>
                {sortedQueue.filter(q => q.contact.dept === deptName).map(({ contact, tasks: contactTasks, count, isSent }) => (
                  <div 
                    key={contact.id} 
                    onClick={() => setActiveContactId(contact.id)}
                    className={`p-4 rounded-[1.5rem] cursor-pointer border-2 transition-all relative group ${activeContactId === contact.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white border-slate-50 hover:border-blue-100 text-slate-600'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-tight">{contact.name}</span>
                        {isSent && <CheckCircle size={14} className={activeContactId === contact.id ? 'text-blue-200' : 'text-emerald-500'} />}
                      </div>
                      {count > 1 && <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeContactId === contact.id ? 'bg-white/20' : 'bg-amber-100 text-amber-600'}`}>冲突聚合</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <button 
          onClick={checkBridge}
          className={`mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${bridgeConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
          {bridgeConnected ? <LinkIcon size={14} /> : <Unlink size={14} />}
          {bridgeConnected ? 'RPA 桥接已连接' : '点击连接 RPA 桥接'}
        </button>
      </div>

      <div className="flex-1 bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col border border-slate-800 overflow-hidden relative">
        {isRpaOperating && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
                <Loader2 size={48} className="text-blue-600 animate-spin" />
                <p className="font-black text-slate-800 text-lg">正在执行自动化调出与填报...</p>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Target: {currentItem?.contact.wechatRemark}</p>
                <p className="text-[10px] text-amber-600 font-bold">请勿操作鼠标键盘</p>
             </div>
          </div>
        )}

        <div className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-10 bg-slate-900/50 backdrop-blur-xl z-10">
          <div className="bg-white/5 p-1 rounded-2xl flex">
            <button onClick={() => setMode('wechat')} className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${mode === 'wechat' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>微信模式</button>
            <button onClick={() => setMode('sms')} className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${mode === 'sms' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>短信模式</button>
          </div>
        </div>

        {currentItem ? (
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl`}>
                  {currentItem.contact.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-white text-xl font-black">{currentItem.contact.name} ({currentItem.contact.position})</h4>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded uppercase">
                      {currentItem.tasks[0].mode}
                    </span>
                    {currentItem.isSent && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded">已处理</span>}
                  </div>
                  <p className="text-slate-500 text-xs font-bold mt-1 tracking-widest">{currentItem.contact.phone} | {currentItem.contact.dept}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">
                  <span>通知内容预览</span>
                </div>
                <div className="relative group">
                  <textarea 
                    value={editableContent} 
                    onChange={e => setEditableContent(e.target.value)} 
                    className="w-full h-64 bg-slate-800/20 border border-white/10 rounded-[2.5rem] p-8 text-slate-100 text-lg outline-none focus:border-blue-500/30 transition-all font-medium leading-relaxed" 
                  />
                  <button onClick={() => copyToClipboard(editableContent, 'content')} className="absolute bottom-6 right-6 p-4 bg-white/5 hover:bg-blue-600 hover:text-white text-slate-400 rounded-2xl border border-white/5 transition-all">
                    {copyStatus === 'content' ? <ClipboardCheck className="text-emerald-400" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              {mode === 'sms' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">
                    <span>辅助参会人员清单</span>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={participantListText} 
                      onChange={e => setParticipantListText(e.target.value)} 
                      className="w-full h-24 bg-slate-800/20 border border-white/10 rounded-[1.5rem] p-6 text-slate-400 text-sm outline-none focus:border-blue-500/30 transition-all font-medium" 
                    />
                    <button onClick={() => copyToClipboard(participantListText, 'queue')} className="absolute bottom-4 right-4 p-3 bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-xl border border-white/5 transition-all">
                      {copyStatus === 'queue' ? <CheckCircle size={16} className="text-emerald-400" /> : <Users size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={handleStartAutomation} 
                  className="flex-1 h-20 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play size={28} />
                  启动自动化填报 / 标记已发
                </button>
                
                <button 
                  onClick={() => {
                    const idx = sortedQueue.findIndex(q => q.contact.id === activeContactId);
                    if (idx < sortedQueue.length - 1) setActiveContactId(sortedQueue[idx + 1].contact.id);
                  }}
                  className="w-20 h-20 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-[2rem] flex items-center justify-center transition-all active:scale-95 border border-white/5"
                >
                  <SkipForward size={28} />
                </button>
              </div>

              <div className="text-center">
                 <span className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
                  发送进度: {sortedQueue.findIndex(q => q.contact.id === activeContactId) + 1} / {sortedQueue.length}
                 </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 font-black uppercase tracking-widest gap-6 opacity-40">
            <CheckCircle size={64} />
            <p className="text-sm tracking-[0.2em]">所有会议通知已执行完毕</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionConsole;
