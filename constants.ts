
import { Contact, Template } from './types.ts';

export const INITIAL_POSITIONS = ['总', '工', '处', '部', '经理', '无'];

export const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: '张杰', dept: '技术办', phone: '13800138001', position: '总', wechatRemark: '技术办-张总', isProcurement: false },
  { id: '2', name: '李冬临', dept: '工程部', phone: '13911112222', position: '工', wechatRemark: '工程-李工', isProcurement: false },
  { id: '3', name: '何秉舜', dept: '办公室', phone: '13566667777', position: '无', wechatRemark: '办-何秉舜', isProcurement: false }
];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'wechat-offline',
    name: '微信-线下会议默认',
    type: 'wechat',
    content: '{{姓}}{{职务}}您好，今天（{{日期}}）{{时间}}在{{地点}}召开“{{主题}}”评审会议，届时请您安排人员参加支持。'
  },
  {
    id: 'wechat-online',
    name: '微信-线上会议默认',
    type: 'wechat',
    content: '{{姓}}{{职务}}您好，今天（{{日期}}）{{时间}}在线召开（视频会议）：“{{主题}}”评审会议，届时请您安排人员参加支持，谢谢！参会方式为腾讯会议，点击链接直接加入会议{{会议链接}}，会议ID：{{会议号}}（联系人：{{联系人}}：{{联系电话}}）'
  },
  {
    id: 'sms-offline',
    name: '短信-线下会议默认',
    type: 'sms',
    content: '您好！{{时间}}在{{地点}}召开“{{主题}}”会议，届时请您准时参加。(联系人：{{联系人}} {{联系电话}})'
  },
  {
    id: 'sms-online',
    name: '短信-线上会议默认',
    type: 'sms',
    content: '您好！{{时间}}在线召开（视频会议）：“{{主题}}”，会议ID：{{会议号}}，链接：{{会议链接}}。'
  },
  {
    id: 'wechat-procurement',
    name: '采购评审专用模板',
    type: 'wechat',
    content: '{{姓}}{{职务}}您好！涉及“{{主题}}”的采购评审会议通知：\n【时间】{{时间}}\n【采购方式】{{采购方式}}\n【项目预算】{{预算}}万元\n请准时出席。'
  },
  {
    id: 'multi-default',
    name: '多会议聚合通知',
    type: 'multi',
    content: '{{姓}}{{职务}}您好，{{日期}}有多个会议评审，届时请您安排人员参加支持：\n{{会议列表}}'
  }
];

export const DEPARTMENTS = ['技术办', '采购部', '财务科', '办公室', '质保部', '人力资源'];

// 默认配置路径
export const DEFAULT_WECHAT_PATH = 'C:\\Program Files\\Tencent\\Weixin\\Weixin.exe';
