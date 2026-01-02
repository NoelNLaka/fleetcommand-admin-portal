
import { Booking, BookingStatus, Customer, CustomerStatus, MaintenanceItem, Stat, PaymentStatus, Vehicle, VehicleStatus, MaintenanceTask, MaintenanceStatus, VehicleActivity } from './types';

export const INITIAL_STATS: Stat[] = [
  {
    label: 'Active Rentals',
    value: '142',
    trend: '5%',
    trendType: 'up',
    icon: 'key',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600'
  },
  {
    label: 'Pending Pickups',
    value: '18',
    trend: '2%',
    trendType: 'up',
    icon: 'schedule',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600'
  },
  {
    label: 'Vehicles Available',
    value: '45',
    trend: '-12%',
    trendType: 'down',
    icon: 'directions_car',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600'
  },
  {
    label: 'Overdue Returns',
    value: '3',
    trend: '0%',
    trendType: 'neutral',
    icon: 'warning',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600'
  }
];

export const REPORT_SUMMARY_STATS: Stat[] = [
  {
    label: 'Total Revenue',
    value: '$142,500',
    trend: '+12%',
    trendType: 'up',
    icon: 'payments',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600',
    subLabel: 'vs last month'
  },
  {
    label: 'Active Rentals',
    value: '85/120',
    subLabel: 'Utilization Rate: 71%',
    percentage: 71,
    icon: 'key',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600'
  },
  {
    label: 'Maintenance',
    value: '4 Vehicles',
    subLabel: '2 Urgent alerts',
    icon: 'handyman',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600'
  },
  {
    label: 'Distance Covered',
    value: '12.4k mi',
    trend: '+5%',
    trendType: 'up',
    icon: 'location_on',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600',
    subLabel: 'vs last month'
  }
];

export const RECENT_VEHICLE_ACTIVITY: VehicleActivity[] = [
  {
    id: '1',
    name: 'Toyota Camry',
    plate: 'ABC-1234',
    status: 'Active Rental',
    location: 'San Francisco, CA',
    odometer: '12,450 mi',
    revenueMtd: '$1,240',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: '2',
    name: 'Tesla Model 3',
    plate: 'EVX-9988',
    status: 'Active Rental',
    location: 'Los Angeles, CA',
    odometer: '24,150 mi',
    revenueMtd: '$2,890',
    image: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: '3',
    name: 'Ford Transit',
    plate: 'TRK-5512',
    status: 'In Maintenance',
    location: 'San Jose, CA',
    odometer: '45,200 mi',
    revenueMtd: '$0',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: '4',
    name: 'Chevrolet Tahoe',
    plate: 'SUV-8821',
    status: 'Available',
    location: 'Oakland, CA',
    odometer: '8,100 mi',
    revenueMtd: '$950',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=150'
  }
];

export const MAINTENANCE_STATS: Stat[] = [
  {
    label: 'Vehicles in Service',
    value: '12',
    trend: '+2',
    trendType: 'up',
    icon: 'directions_car',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600'
  },
  {
    label: 'Critical Alerts',
    value: '3',
    subLabel: 'Overdue Actions',
    icon: 'warning',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600'
  },
  {
    label: 'MTD Cost',
    value: '$4,200',
    trend: '5%',
    trendType: 'down',
    icon: 'attach_money',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600'
  }
];

export const MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: '1',
    vehicleName: 'Toyota Camry',
    vehicleVin: 'VIN-84920',
    vehicleImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=150',
    serviceType: 'Oil Change & Inspection',
    status: MaintenanceStatus.OVERDUE,
    assigneeName: "Mike's Auto",
    assigneeAvatar: 'https://i.pravatar.cc/150?u=mike',
    costEstimate: '$120.00'
  },
  {
    id: '2',
    vehicleName: 'Ford Transit',
    vehicleVin: 'VIN-33921',
    vehicleImage: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=150',
    serviceType: 'Brake Pad Replacement',
    status: MaintenanceStatus.IN_SHOP,
    assigneeName: "Central Service",
    assigneeAvatar: 'https://i.pravatar.cc/150?u=central',
    costEstimate: '$450.00',
    currentStep: 'In Shop',
    estCompletion: 'Today, 4:00 PM'
  },
  {
    id: '3',
    vehicleName: 'Tesla Model 3',
    vehicleVin: 'VIN-92831',
    vehicleImage: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=150',
    serviceType: 'Tire Rotation',
    status: MaintenanceStatus.SCHEDULED,
    assigneeName: "EV Specialists",
    assigneeAvatar: 'https://i.pravatar.cc/150?u=evspec',
    costEstimate: '$80.00'
  },
  {
    id: '4',
    vehicleName: 'Isuzu Truck',
    vehicleVin: 'VIN-11029',
    vehicleImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=150',
    serviceType: 'Annual Inspection',
    status: MaintenanceStatus.SCHEDULED,
    assigneeName: "Truck Masters",
    assigneeAvatar: 'https://i.pravatar.cc/150?u=truckm',
    costEstimate: '$350.00'
  }
];

export const INVENTORY: Vehicle[] = [
  {
    id: '1',
    name: 'Toyota Camry',
    year: '2023',
    trim: 'LE Hybrid',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=300',
    plate: 'ABC-1234',
    vin: 'VIN...8923',
    status: VehicleStatus.AVAILABLE,
    location: 'LAX Airport Lot B',
    mileage: '12,400 mi',
    dailyRate: '$45.00'
  },
  {
    id: '2',
    name: 'Tesla Model 3',
    year: '2022',
    trim: 'Long Range',
    image: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=300',
    plate: 'EVX-9988',
    vin: 'VIN...4421',
    status: VehicleStatus.RENTED,
    location: 'San Francisco',
    mileage: '24,150 mi',
    dailyRate: '$89.00'
  },
  {
    id: '3',
    name: 'Ford F-150',
    year: '2021',
    trim: 'XLT 4WD',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=300',
    plate: 'TRK-5512',
    vin: 'VIN...1190',
    status: VehicleStatus.MAINTENANCE,
    location: 'Shop A - Body Work',
    mileage: '45,200 mi',
    dailyRate: '$75.00'
  }
];

export const CUSTOMERS: Customer[] = [
  {
    id: 'C1',
    name: 'Sarah Jennings',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 123-4567',
    address: '4293 Euclid Avenue, San Francisco, CA 94112',
    customerId: '#99210',
    location: 'San Francisco, CA',
    status: CustomerStatus.ACTIVE,
    profileImage: 'https://i.pravatar.cc/150?u=sarah',
    licenseVerified: true,
    returnDate: 'Oct 24',
    lastDLDigits: '492',
    internalNotes: 'Customer prefers contactless pickup. Always verify insurance card on file before release.',
    license: {
      state: 'CALIFORNIA',
      number: 'D9283910',
      class: 'C (Standard)',
      expires: '12 May 2028',
      issued: '12 May 2023'
    },
    currentRental: {
      vehicleName: 'Tesla Model 3',
      licensePlate: '8XCV221',
      color: 'Silver',
      image: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=300',
      pickupDate: 'Oct 24, 10:00 AM',
      returnDate: 'Oct 27, 10:00 AM',
      totalAmount: '$180.00 Total',
      remainingDays: 1,
      totalDays: 3
    }
  },
  {
    id: 'C2',
    name: 'Michael Chen',
    email: 'michael.c@example.com',
    phone: '+1 (555) 092-1122',
    address: '88 Market St, San Francisco, CA 94103',
    customerId: '#99211',
    location: 'San Francisco, CA',
    status: CustomerStatus.PENDING,
    profileImage: 'https://i.pravatar.cc/150?u=michael',
    licenseVerified: false,
    isNew: true,
    lastDLDigits: '***',
    license: {
      state: 'CALIFORNIA',
      number: 'Pending',
      class: 'Pending',
      expires: 'Pending',
      issued: 'Pending'
    }
  }
];

export const DETAILED_BOOKINGS: Booking[] = [
  {
    id: '1',
    bookingId: '#BK-8392',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@example.com',
    customerAvatar: 'https://i.pravatar.cc/150?u=sarah_connor',
    vehicleName: 'Tesla Model 3',
    vehicleId: 'TSL - 2024',
    startDate: 'Jun 10',
    endDate: 'Jun 15',
    durationDays: 5,
    status: BookingStatus.ACTIVE,
    paymentStatus: PaymentStatus.PAID
  },
  {
    id: '2',
    bookingId: '#BK-8393',
    customerName: 'John Doe',
    customerEmail: 'john.d@example.com',
    customerAvatar: 'https://i.pravatar.cc/150?u=john_doe',
    vehicleName: 'Ford Transit',
    vehicleId: 'FRD - 9981',
    startDate: 'Jun 12',
    endDate: 'Jun 13',
    durationDays: 1,
    status: BookingStatus.PENDING_PICKUP,
    paymentStatus: PaymentStatus.UNPAID
  }
];

export const INVENTORY_STATS: Stat[] = [
  {
    label: 'Total Vehicles',
    value: '142',
    icon: 'directions_car',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600'
  },
  {
    label: 'Available',
    value: '89',
    icon: 'check_circle',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600'
  },
  {
    label: 'Rented',
    value: '45',
    icon: 'key',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600'
  },
  {
    label: 'Maintenance',
    value: '8',
    icon: 'build',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600'
  }
];

export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: '1',
    vehicleName: 'Toyota Camry LE',
    service: 'Oil Change',
    dueDate: 'Due Today',
    icon: 'oil_barrel',
    isUrgent: true
  }
];

export const RECENT_BOOKINGS: Booking[] = DETAILED_BOOKINGS;
