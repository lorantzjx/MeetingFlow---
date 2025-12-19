
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Contact, MeetingTask } from '../types';
// Added Send to the imports
import { Calendar, Users, CheckCircle, Clock, Send } from 'lucide-react';

interface Props {
  tasks: MeetingTask[];
  contacts: Contact[];
}

const Dashboard: React.FC<Props> = ({ tasks, contacts }) => {
  const stats = [
    { label: '累计会议', value: tasks.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '参会总人次', value: tasks.reduce((acc, t) => acc + t.participants.length, 0), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '已完成任务', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '待处理', value: tasks.filter(t => t.status === 'draft').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  // Chart data
  const chartData = tasks.slice(-7).map(t => ({
    name: t.subject.length > 6 ? t.subject.slice(0, 5) + '...' : t.subject,
    participants: t.participants.length
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className={`${s.bg} p-3 rounded-xl`}>
              <s.icon className={s.color} size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">近期参会强度分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="participants" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">快捷入口</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl border border-blue-100 group">
              <Calendar className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-blue-700">发起新会议</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-emerald-50 hover:bg-emerald-100 transition-colors rounded-xl border border-emerald-100 group">
              <Users className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-emerald-700">导入通讯录</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-amber-50 hover:bg-amber-100 transition-colors rounded-xl border border-amber-100 group">
              <Send className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-amber-700">查看待发通知</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 group">
              <Clock className="text-slate-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-slate-700">历史任务库</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">最新发送记录</h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">查看更多</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">会议主题</th>
                <th className="px-6 py-4 font-semibold">通知人数</th>
                <th className="px-6 py-4 font-semibold">发送状态</th>
                <th className="px-6 py-4 font-semibold">操作时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tasks.length > 0 ? (
                tasks.slice(-5).reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{t.subject}</td>
                    <td className="px-6 py-4">{t.participants.length} 人</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {t.status === 'completed' ? '已完成' : '待处理'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">暂无会议记录</td>
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
