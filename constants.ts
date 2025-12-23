
import { Contact, Template } from './types';

export const INITIAL_POSITIONS = ['总', '工', '处', '部', '经理', '无'];

export const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: '张杰', dept: '技术办', phone: '13800138001', position: '总', wechatRemark: '技术办-张总', isProcurement: false },
  { id: '2', name: '李冬临', dept: '工程部', phone: '13911112222', position: '工', wechatRemark: '工程-李工', isProcurement: false },
  { id: '3', name: '何秉舜', dept: '办公室', phone: '13566667777', position: '无', wechatRemark: '办-何秉舜', isProcurement: false }
];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'sms-default',
    name: '标准线下会议短信',
    type: 'sms',
    content: '您好！{{时间}}在{{地点}}召开“{{主题}}”会议，届时请您准时参加。(联系人：{{发布部门}} {{联系人}} {{联系电话}})'
  },
  {
    id: 'wechat-default',
    name: '微信详细通知',
    type: 'wechat',
    content: '{{姓名}}{{职务}}，您好！\n关于“{{主题}}”的会议通知：\n【时间】{{时间}}\n【地点】{{地点}}\n【会议ID】{{会议号}}\n【会议链接】{{会议链接}}\n请准时出席，收到请回复。'
  }
];

export const DEPARTMENTS = ['技术办', '采购部', '财务科', '办公室', '质保部', '人力资源'];
