
export enum Position {
  ZONG = '总',
  GONG = '工',
  CHU = '处',
  BU = '部',
  NONE = '无'
}

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
  type: 'wechat' | 'sms' | 'multi'; // 增加多会议聚合模板类型
}

export interface Contact {
  id: string;
  name: string;
  dept: string;
  phone: string;
  position: Position;
  wechatRemark: string;
  isProcurement: boolean;
}

export interface ParticipantStatus {
  contactId: string;
  mode: ParticipantMode;
  replied: boolean;
  isSent?: boolean; // 增加发送标记
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
  rpaDelayMin: number;
  rpaDelayMax: number;
  smsUrl: string;
  wechatPath: string;
  templates: Template[];
}
