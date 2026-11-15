export interface UserProfile {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  fullName: string;
  employeeCode: string;
  department?: string;
  designation?: string;
  roles: string[];
  permissions: string[];
  status: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface LoginDto {
  username: string;
  password: string;
}
