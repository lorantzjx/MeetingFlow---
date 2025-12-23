
export enum MeetingMode {
  OFFLINE = '纯线下',
  ONLINE = '纯线上',
  MIXED = '混合模式'
}

export enum ParticipantMode {
  OFFLINE = '线下',
  ONLINE = '线上'
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
  position: string; // 修改为 string 支持动态增加
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
  procurementInfo?: {
    method: string;
    budget: string;
  }
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
  positions: string[]; // 新增：动态职务列表
  rpaDelayMin: number;
  rpaDelayMax: number;
  smsUrl: string;
  wechatPath: string;
  templates: Template[];
}
