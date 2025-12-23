
import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Upload, 
  Trash2, 
  Edit3, 
  Check
} from 'lucide-react';
import { Contact } from '../types.ts';

interface Props {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  departments: string[];
  positions: string[];
}

const ContactsManager: React.FC<Props> = ({ contacts, setContacts, departments, positions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.wechatRemark.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const contactData: Partial<Contact> = {
      name: formData.get('name') as string,
      dept: formData.get('dept') as string,
      phone: formData.get('phone') as string,
      position: formData.get('position') as string,
      wechatRemark: formData.get('wechatRemark') as string,
      isProcurement: formData.get('isProcurement') === 'on'
    };

    if (editingContact) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...contactData } as Contact : c));
    } else {
      setContacts(prev => [...prev, { ...contactData as Contact, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setIsModalOpen(false);
    setEditingContact(null);
  };

  // 修复：删除按钮点击没反应 BUG
  const handleDeleteContact = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    e.preventDefault();
    if (window.confirm('确定要从通讯录中删除该人员吗？此操作不可撤销。')) {
      const newContacts = contacts.filter(c => c.id !== id);
      setContacts([...newContacts]); // 强制触发引用更新
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索姓名、部门或微信备注..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-bold">
            <Upload size={18} />
            <span>Excel 导入</span>
          </button>
          <button 
            onClick={() => { setEditingContact(null); setIsModalOpen(true); }}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 font-black uppercase tracking-widest text-xs"
          >
            <UserPlus size={18} />
            <span>新增人员</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">姓名</th>
                <th className="px-6 py-5">所属部门</th>
                <th className="px-6 py-5">职务称呼</th>
                <th className="px-6 py-5">微信备注</th>
                <th className="px-6 py-5">手机号</th>
                <th className="px-6 py-5 text-center">采购属性</th>
                <th className="px-6 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredContacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 font-black text-slate-900">{c.name}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-black uppercase tracking-tight">
                      {c.dept}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-sm">{c.position}</td>
                  <td className="px-6 py-5 text-blue-600 font-black text-sm">{c.wechatRemark}</td>
                  <td className="px-6 py-5 font-medium tabular-nums text-slate-500">{c.phone}</td>
                  <td className="px-6 py-5 text-center">
                    {c.isProcurement ? (
                      <div className="inline-flex items-center justify-center px-2 py-1 bg-amber-100 text-amber-600 rounded-md text-[10px] font-black">
                        采购类
                      </div>
                    ) : <span className="text-slate-200">/</span>}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => { setEditingContact(c); setIsModalOpen(true); }}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteContact(e, c.id)}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">
                {editingContact ? '编辑联系人资料' : '录入新人员'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">姓名</label>
                  <input name="name" defaultValue={editingContact?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">部门</label>
                  <select name="dept" defaultValue={editingContact?.dept} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">职务/称呼</label>
                <div className="flex flex-wrap gap-2">
                  {positions.map(p => (
                    <label key={p} className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="position" 
                        value={p} 
                        defaultChecked={editingContact?.position === p || (!editingContact && p === '无')} 
                        className="peer hidden" 
                      />
                      <span className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-black peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all block">
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">微信备注 (自动化检索唯一标识)</label>
                <input name="wechatRemark" defaultValue={editingContact?.wechatRemark} required placeholder="例如: 技术办-张总" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">手机号</label>
                <input name="phone" defaultValue={editingContact?.phone} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <input type="checkbox" name="isProcurement" id="isProc" defaultChecked={editingContact?.isProcurement} className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                <label htmlFor="isProc" className="text-xs font-black text-amber-700 uppercase tracking-widest">标记为采购类人员</label>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-xl transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-10 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsManager;
