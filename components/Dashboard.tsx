
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Contact, MeetingTask } from '../types.ts';
import { Calendar, Users, CheckCircle, Clock, Send, Zap, AlertTriangle } from 'lucide-react';

interface Props {
  tasks: MeetingTask[];
  contacts: Contact[];
}

const Dashboard: React.FC<Props> = ({ tasks, contacts }) => {
  // 计算聚合冲突数
  const aggregationCount = useMemo(() => {
    const contactTasksMap = new Map<string, number>();
    tasks.filter(t => t.status !== 'completed').forEach(task => {
      task.participants.forEach(p => {
        contactTasksMap.set(p.contactId, (contactTasksMap.get(p.contactId) || 0) + 1);
      });
    });
    return Array.from(contactTasksMap.values()).filter(count => count > 1).length;
  }, [tasks]);

  const stats = [
    { label: '累计会议', value: tasks.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '参会总人次', value: tasks.reduce((acc, t) => acc + t.participants.length, 0), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '多会议冲突', value: aggregationCount, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', sub: '已自动开启聚合逻辑' },
    { label: '待处理任务', value: tasks.filter(t => t.status === 'draft').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  // 图表数据
  const chartData = tasks.slice(-7).map(t => ({
    name: t.subject.length > 6 ? t.subject.slice(0, 5) + '...' : t.subject,
    participants: t.participants.length
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${s.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                <s.icon className={s.color} size={28} />
              </div>
              {s.sub && (
                <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                   <AlertTriangle size={10} /> {s.sub}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-4xl font-black text-slate-900 tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">近期会议分布图</h3>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-blue-600" />
               <span className="text-xs font-bold text-slate-400 uppercase">参会规模 (人)</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="participants" radius={[12, 12, 12, 12]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between text-white border border-slate-800 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
             <Zap size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2">快捷操作</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-8">Quick Action Engine</p>
            
            <div className="grid grid-cols-1 gap-4">
              <button className="flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] border border-white/5 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="font-black text-sm">发起通知任务</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">New notification</p>
                </div>
              </button>
              
              <button className="flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] border border-white/5 transition-all text-left group/btn">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div>
                  <p className="font-black text-sm">维护通讯录</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Contacts Manager</p>
                </div>
              </button>

              <button className="flex items-center gap-4 p-5 bg-amber-600 hover:bg-amber-700 rounded-[1.5rem] transition-all text-left shadow-xl shadow-amber-600/20 group/btn">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <Send size={24} />
                </div>
                <div>
                  <p className="font-black text-sm">进入发送控制台</p>
                  <p className="text-[10px] text-white/50 font-bold uppercase">Execution Console</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">最新发送日志</h3>
          <button className="text-xs font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">查看完整报告</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">会议主题</th>
                <th className="px-8 py-5">通知对象</th>
                <th className="px-8 py-5">处理进度</th>
                <th className="px-8 py-5">时间节点</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tasks.length > 0 ? (
                tasks.slice(-5).reverse().map((t) => {
                  const sentCount = t.participants.filter(p => p.isSent).length;
                  const totalCount = t.participants.length;
                  const progress = Math.round((sentCount / totalCount) * 100);
                  
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{t.subject}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{t.mode}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">{totalCount} 人</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'} transition-all`} style={{ width: `${progress}%` }} />
                          </div>
                          <span className={`text-[10px] font-black ${progress === 100 ? 'text-emerald-600' : 'text-slate-400'}`}>{progress}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center space-y-2">
                    <Clock size={32} className="mx-auto text-slate-200" />
                    <p className="text-slate-400 text-xs italic font-medium tracking-widest uppercase">暂无会议通知记录</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
