export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobile: string;
  gender: string;
  dateOfJoining: string;
  department?: string;
  designation?: string;
  status: string;
  hasLoginAccount: boolean;
  username?: string;
  roles: string[];
  createdAt: string;
}

export interface EmployeeDetails {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  altMobile?: string;
  gender: string;
  dob?: string;
  dateOfJoining: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  status: string;
  profileImageUrl?: string;
  notes?: string;
  department?: { id: string; name: string };
  designation?: { id: string; title: string };
  reportingManager?: { id: string; firstName: string; lastName: string; employeeCode: string };
  userAccount?: {
    id: string;
    username: string;
    status: string;
    lastLoginAt?: string;
    userRoles: { role: { id: string; name: string; slug: string } }[];
  };
}
