
import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Upload, 
  Trash2, 
  Edit3, 
  Check
} from 'lucide-react';
import { Contact } from '../types';

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
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...contactData } : c));
    } else {
      setContacts(prev => [...prev, { ...contactData as Contact, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setIsModalOpen(false);
    setEditingContact(null);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="搜索姓名、部门..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
          <UserPlus size={18} />
          <span>新增人员</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-black">姓名</th>
              <th className="px-6 py-4 font-black">部门</th>
              <th className="px-6 py-4 font-black">职务</th>
              <th className="px-6 py-4 font-black text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredContacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                <td className="px-6 py-4 text-sm font-medium">{c.dept}</td>
                <td className="px-6 py-4 text-sm font-medium">{c.position}</td>
                <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingContact(c); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={16} /></button>
                    <button onClick={() => setContacts(prev => prev.filter(x => x.id !== c.id))} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">{editingContact ? '编辑联系人' : '新增联系人'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase">姓名</label>
                  <input name="name" defaultValue={editingContact?.name} required className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase">部门</label>
                  <select name="dept" defaultValue={editingContact?.dept} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">职务称呼</label>
                <div className="flex flex-wrap gap-2">
                  {positions.map(p => (
                    <label key={p} className="cursor-pointer">
                      <input type="radio" name="position" value={p} defaultChecked={editingContact?.position === p || (!editingContact && p === '无')} className="peer hidden" />
                      <span className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-black peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all block">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">手机号</label>
                <input name="phone" defaultValue={editingContact?.phone} required className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">微信备注</label>
                <input name="wechatRemark" defaultValue={editingContact?.wechatRemark} required className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none font-bold" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">取消</button>
                <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsManager;
