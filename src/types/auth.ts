export type UserType =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'CUSTOMER'
  | 'EMPLOYEE'
  | 'ACCOUNTANT'
  | 'DRIVER'
  | 'GUARD'
  | 'INVENTORY_MANAGER'
  | 'WAREHOUSE_MANAGER'
  | 'ORDER_MANAGER'
  | 'PURCHASING_MANAGER'
  | 'SALES_OFFICER';

export const UserTypeLabels: Record<UserType, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  CUSTOMER: 'Customer',
  EMPLOYEE: 'Employee',
  ACCOUNTANT: 'Accountant',
  DRIVER: 'Driver',
  GUARD: 'Guard',
  INVENTORY_MANAGER: 'Inventory Manager',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  ORDER_MANAGER: 'Order Manager',
  PURCHASING_MANAGER: 'Purchasing Manager',
  SALES_OFFICER: 'Sales Officer',
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  userType: UserType;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
