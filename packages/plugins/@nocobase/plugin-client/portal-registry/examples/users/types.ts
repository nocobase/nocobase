import type { Role } from "@/lib/nocobase/acl";

export type UserRecord = {
  id: string | number;
  nickname?: string;
  username?: string;
  email?: string;
  phone?: string;
  roles?: Role[];
  createdAt?: string;
  updatedAt?: string;
};

export type UserFormValues = {
  nickname: string;
  username: string;
  email: string;
  phone: string;
  password?: string;
};

export type RoleRecord = Role & {
  id?: string | number;
  description?: string;
  default?: boolean;
  hidden?: boolean;
  allowConfigure?: boolean;
  strategy?: {
    actions?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
};
