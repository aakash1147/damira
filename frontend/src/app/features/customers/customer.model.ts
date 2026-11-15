export interface CustomerListItem {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  companyName?: string;
  customerType: string;
  customerTypeCode: string;
  email?: string;
  mobile: string;
  gstin?: string;
  pan?: string;
  status: string;
  city: string;
  state: string;
  totalAddresses: number;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  addressTypeId: string;
  addressLabel: string;
  contactPersonName?: string;
  contactMobile?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  countryId: string;
  stateId: string;
  cityId: string;
  district?: string;
  postalCode: string;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
  isActive: boolean;
  createdAt: string;
  addressType?: { id: string; name: string; code: string };
  country?: { id: string; name: string; iso2: string };
  state?: { id: string; name: string; code: string; gstCode?: string };
  city?: { id: string; name: string };
}

export interface CustomerProfile {
  id: string;
  customerCode: string;
  customerTypeId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  mobile: string;
  altMobile?: string;
  gstin?: string;
  pan?: string;
  dob?: string;
  gender?: string;
  source?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerType: { id: string; name: string; code: string };
  createdBy?: { id: string; username: string; employee?: { firstName: string; lastName: string } };
  updatedBy?: { id: string; username: string; employee?: { firstName: string; lastName: string } };
  addresses: CustomerAddress[];
}
