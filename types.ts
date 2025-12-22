
export enum MeetingMode {
  OFFLINE = '纯线下',
  ONLINE = '纯线上',
  MIXED = '混合模式'
}

export enum ParticipantMode {
  OFFLINE = '线下',
  ONLINE = '线上'
}

// Added missing Position enum to fix "no exported member" errors
export enum Position {
  ZONG = '总',
  GONG = '工',
  CHU = '处',
  BU = '部',
  NONE = '无'
}

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'wechat' | 'sms' | 'multi';
}

export interface Contact {
  id: string;
  name: string;
  dept: string;
  phone: string;
  position: string; // 修改为 string 以支持动态职务
  wechatRemark: string;
  isProcurement: boolean;
}

export interface ParticipantStatus {
  contactId: string;
  mode: ParticipantMode;
  replied: boolean;
  isSent?: boolean;
  useDefaultFiles: boolean;
  customFiles: string[];
}

export interface MeetingTask {
  id: string;
  subject: string;
  time: string;
  location?: string;
  meetingId?: string;
  meetingLink?: string;
  contactPerson: string;
  contactPhone: string;
  attachments: string[];
  mode: MeetingMode;
  participants: ParticipantStatus[];
  status: 'draft' | 'sending' | 'completed';
  createdAt: number;
}

export interface AppSettings {
  departments: string[];
  positions: string[]; // 新增动态职务管理
  rpaDelayMin: number;
  rpaDelayMax: number;
  smsUrl: string;
  wechatPath: string;
  templates: Template[];
}