import { api, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';

export type AttendanceStatus = 'NOT_MARKED' | 'IN_PROGRESS' | 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'HOLIDAY';
export type WarehouseCategory = 'STAFF' | 'DRIVER' | 'LABOR' | 'WB_LABOR';
export type Department = 'WAREHOUSE' | 'ADMINISTRATION';

export interface AttUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  userType: string;
  warehouseCategory: WarehouseCategory;
}

export interface AttRecord {
  id: string;
  punchIn: string | null;
  punchOut: string | null;
  status: AttendanceStatus;
  extraMinutes: number;
  isManualAbsent: boolean;
  lastAction: 'PUNCH_IN' | 'PUNCH_OUT' | 'ABSENT' | null;
  remark: string | null;
}

export interface DailyAttendance {
  date: string;
  isHoliday: boolean;
  holidaySource: 'SUNDAY' | 'DECLARED' | null;
  holiday: { id: string; name: string; date: string } | null;
  employees: {
    user: AttUser;
    workingMinutesPerDay: number;
    halfDayMinutes: number;
    record: AttRecord | null;
    displayStatus: AttendanceStatus;
  }[];
}

export interface AttSummary {
  present: number;
  halfDay: number;
  absent: number;
  holiday: number;
  notMarked: number;
  inProgress: number;
  totalExtraMinutes: number;
  totalWorkedMinutes: number;
}

export interface Payroll {
  workingDays: number;
  totalOtHours: number;
  holidays: number;
  sundays: number;
  absents: number;
  total: number;
  salary: number | null;
  amount: number | null;
  payable: number | null;
  totalAdvanceDue: number;
  deductionAdvance: number;
  deductionOther: number;
}

export interface AdvanceLedgerEntry {
  id?: string;
  type: 'GRANT' | 'DEDUCTION';
  year: number;
  month: number;
  amount: number;
  note?: string;
}

export interface MonthlyRow {
  user: AttUser;
  salaryType: 'MONTHLY' | 'DAILY' | null;
  salaryAmount: number | null;
  otEligible: boolean;
  otHourlyRate: number | null;
  trips: number | null;
  totalKm: number | null;
  cells: { date: string; displayStatus: AttendanceStatus; record: AttRecord | null }[];
  summary: AttSummary;
  advanceGrants: { id?: string; year: number; month: number; amount: number; note?: string }[];
  advanceLedger: AdvanceLedgerEntry[];
  payroll: Payroll;
}

export interface MonthlyAttendance {
  year: number;
  month: number;
  days: { date: string; dayOfMonth: number; weekday: string; isHoliday: boolean; holidayName: string | null }[];
  groups: { label: string; category: WarehouseCategory; employees: MonthlyRow[] }[];
}

export interface EmployeeMonthly {
  employee: AttUser;
  year: number;
  month: number;
  days: {
    date: string;
    weekday: string;
    isHoliday: boolean;
    holidayName: string | null;
    displayStatus: AttendanceStatus;
    record: AttRecord | null;
  }[];
  summary: AttSummary;
}

export interface Holiday {
  id: string;
  date: string;
  department: Department;
  name: string | null;
}

export interface AttProfile {
  user: AttUser;
  workingMinutesPerDay: number;
  halfDayMinutes: number;
  salaryType: 'MONTHLY' | 'DAILY' | null;
  salaryAmount: number | null;
  otEligible: boolean;
  otHourlyRate: number | null;
  profileId: string | null;
}

export interface ProfileBody {
  workingMinutesPerDay: number;
  halfDayMinutes: number;
  salaryType: 'MONTHLY' | 'DAILY' | null;
  salaryAmount: number | null;
  otEligible: boolean;
  otHourlyRate: number | null;
}

type RecordRes = { record: AttRecord | null };

export const attendanceService = {
  daily: async (date: string) => (await api.get<DailyAttendance>(path(EP.ATTENDANCE.DAILY, { date }))).data,
  monthly: async (year: number, month: number) =>
    (await api.get<MonthlyAttendance>(path(EP.ATTENDANCE.MONTHLY, { year, month }))).data,
  employeeMonthly: async (userId: string, year: number, month: number) =>
    (await api.get<EmployeeMonthly>(path(EP.ATTENDANCE.EMPLOYEE_MONTHLY, { userId, year, month }))).data,
  punchIn: async (userId: string, date: string, time: string) =>
    (await api.post<RecordRes>(EP.ATTENDANCE.PUNCH_IN, { userId, date, time })).data.record,
  punchOut: async (userId: string, date: string, time: string) =>
    (await api.post<RecordRes>(EP.ATTENDANCE.PUNCH_OUT, { userId, date, time })).data.record,
  markAbsent: async (userId: string, date: string) =>
    (await api.post<RecordRes>(EP.ATTENDANCE.MARK_ABSENT, { userId, date })).data.record,
  undo: async (userId: string, date: string) =>
    (await api.post<RecordRes>(EP.ATTENDANCE.UNDO, { userId, date })).data.record,
  remark: async (userId: string, date: string, remark: string | null) =>
    (await api.post<RecordRes>(EP.ATTENDANCE.REMARK, { userId, date, remark })).data.record,
  updatePayroll: async (
    year: number,
    month: number,
    userId: string,
    body: { deductionAdvance: number; deductionOther: number }
  ) => {
    await api.put(path(EP.ATTENDANCE.PAYROLL, { year, month, userId }), body);
  },
  addAdvance: async (body: { userId: string; amount: number; year: number; month: number; note?: string }) => {
    await api.post(EP.ATTENDANCE.ADVANCES, body);
  },
  deleteAdvance: async (id: string, year: number, month: number) => {
    await api.delete(path(EP.ATTENDANCE.ADVANCE, { id }), { params: { year, month } });
  },
  holidays: async (department: Department) =>
    (await api.get<{ holidays: Holiday[] }>(EP.ATTENDANCE.HOLIDAYS, { params: { department } })).data.holidays,
  addHoliday: async (body: { date: string; department: Department; name?: string }) => {
    await api.post(EP.ATTENDANCE.HOLIDAYS, body);
  },
  deleteHoliday: async (id: string) => {
    await api.delete(path(EP.ATTENDANCE.HOLIDAY, { id }));
  },
  profiles: async (department: Department) =>
    (await api.get<{ profiles: AttProfile[] }>(EP.ATTENDANCE.PROFILES, { params: { department } })).data.profiles,
  updateProfile: async (userId: string, body: ProfileBody) => {
    await api.put(path(EP.ATTENDANCE.PROFILE, { userId }), body);
  },
};
