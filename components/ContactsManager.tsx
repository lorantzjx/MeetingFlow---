
import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Upload, 
  Trash2, 
  Edit3, 
  Check
} from 'lucide-react';
import { Contact, Position } from '../types';
import { POSITIONS } from '../constants';

interface Props {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  departments: string[];
}

const ContactsManager: React.FC<Props> = ({ contacts, setContacts, departments }) => {
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
      position: formData.get('position') as Position,
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

  const deleteContact = (id: string) => {
    if (confirm('确定删除该联系人？')) {
      setContacts(prev => prev.filter(c => c.id !== id));
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
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            <Upload size={18} />
            <span className="font-medium">Excel 导入</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            <span className="font-medium">新增人员</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">姓名</th>
                <th className="px-6 py-4 font-semibold">所属部门</th>
                <th className="px-6 py-4 font-semibold">职务称呼</th>
                <th className="px-6 py-4 font-semibold">微信备注</th>
                <th className="px-6 py-4 font-semibold">手机号</th>
                <th className="px-6 py-4 font-semibold text-center">采购属性</th>
                <th className="px-6 py-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredContacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                      {c.dept}
                    </span>
                  </td>
                  <td className="px-6 py-4">{c.position}</td>
                  <td className="px-6 py-4 text-blue-600 font-mono text-sm">{c.wechatRemark}</td>
                  <td className="px-6 py-4">{c.phone}</td>
                  <td className="px-6 py-4 text-center">
                    {c.isProcurement ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-full">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingContact(c); setIsModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteContact(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {editingContact ? '编辑联系人' : '新增联系人'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">姓名</label>
                  <input name="name" defaultValue={editingContact?.name} required className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">部门</label>
                  <select name="dept" defaultValue={editingContact?.dept} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">职务称呼</label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(p => (
                    <label key={p} className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="position" 
                        value={p} 
                        defaultChecked={editingContact?.position === p || (!editingContact && p === Position.NONE)} 
                        className="peer hidden" 
                      />
                      <span className="px-4 py-1.5 border rounded-full text-sm font-medium peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all">
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">微信备注 (RPA检索唯一凭据)</label>
                <input name="wechatRemark" defaultValue={editingContact?.wechatRemark} required placeholder="例如: 采购部-李部长" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">手机号</label>
                <input name="phone" defaultValue={editingContact?.phone} required className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" name="isProcurement" id="isProc" defaultChecked={editingContact?.isProcurement} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isProc" className="text-sm font-medium text-slate-700">属于采购类人员 (触发特定字段)</label>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                  保存
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
