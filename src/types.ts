
export enum BookingStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  PENDING_PICKUP = 'Pending Pickup',
  CONFIRMED = 'Confirmed'
}

export enum UserRole {
  SUPERADMIN = 'Superadmin',
  ADMIN = 'Admin',
  CLIENT_OFFICER = 'Client Officer',
  WORKSHOP_SUPERVISOR = 'Workshop supervisor',
  MECHANIC = 'Mechanic'
}

export enum PaymentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  PARTIAL = 'Partial'
}

export enum CustomerStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  INACTIVE = 'Inactive',
  BANNED = 'Banned'
}

export enum VehicleStatus {
  AVAILABLE = 'Available',
  RENTED = 'Rented',
  MAINTENANCE = 'Maintenance'
}

export enum MaintenanceStatus {
  OVERDUE = 'Overdue',
  IN_SHOP = 'In Shop',
  SCHEDULED = 'Scheduled',
  DONE = 'Done'
}

export enum InsuranceRecordType {
  INSURANCE = 'insurance',
  REGISTRATION = 'registration',
  SAFETY_STICKER = 'safety_sticker'
}

export enum InsuranceStatus {
  VALID = 'VALID',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED'
}

export interface Vehicle {
  id: string;
  name: string;
  year: string;
  trim: string;
  image: string;
  plate: string;
  vin: string;
  status: VehicleStatus;
  location: string;
  mileage: string;
  dailyRate: string;
}

export interface VehicleActivity {
  id: string;
  name: string;
  plate: string;
  status: string;
  location: string;
  odometer: string;
  revenueMtd: string;
  image: string;
}

export interface Booking {
  id: string;
  bookingId: string;
  vehicleName: string;
  vehicleId: string;
  vehicleImage?: string;
  licensePlate?: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  startDate: string;
  endDate: string;
  durationDays: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerId: string;
  location: string;
  status: CustomerStatus;
  profileImage: string;
  licenseVerified: boolean;
  returnDate?: string;
  lastDLDigits: string;
  isNew?: boolean;
  internalNotes?: string;
  license: {
    state: string;
    number: string;
    class: string;
    expires: string;
    issued: string;
  };
  currentRental?: {
    vehicleName: string;
    licensePlate: string;
    color: string;
    image: string;
    pickupDate: string;
    returnDate: string;
    totalAmount: string;
    remainingDays: number;
    totalDays: number;
  };
}

export interface MaintenanceTask {
  id: string;
  vehicleName: string;
  vehicleVin: string;
  vehicleImage: string;
  serviceType: string;
  status: MaintenanceStatus;
  assigneeName: string;
  assigneeAvatar: string;
  costEstimate: string;
  currentStep?: 'Scheduled' | 'In Shop' | 'QC Check' | 'Done';
  estCompletion?: string;
  arrivalMileage?: number;
  notes?: string;
}

export interface InsuranceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  vehicleImage?: string;
  recordType: InsuranceRecordType;
  dateRenewed: string;
  expiryDate: string;
  provider?: string;
  policyNumber?: string;
  cost?: number;
  notes?: string;
  status: InsuranceStatus;
  daysUntilExpiry: number;
}

export interface MaintenanceItem {
  id: string;
  vehicleName: string;
  service: string;
  dueDate: string;
  icon: string;
  isUrgent: boolean;
}

export interface Stat {
  label: string;
  value: string;
  trend?: number | string;
  trendType?: 'up' | 'down' | 'neutral';
  icon: string;
  iconBg: string;
  iconColor: string;
  subLabel?: string;
  percentage?: number;
}
