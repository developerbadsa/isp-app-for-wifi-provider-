import { Package, Ticket, Invoice, Notification, User } from '../types';

export const mockPackages: Package[] = [
  {
    id: '1',
    name: 'Basic',
    speed: 20,
    validity: 30,
    price: 600,
    isPopular: false,
    features: ['20 Mbps Speed', '30 Days Validity', '24/7 Support'],
  },
  {
    id: '2',
    name: 'Standard',
    speed: 50,
    validity: 30,
    price: 950,
    isPopular: true,
    features: ['50 Mbps Speed', '30 Days Validity', '24/7 Support', 'Free Router'],
  },
  {
    id: '3',
    name: 'Turbo',
    speed: 100,
    validity: 30,
    price: 1500,
    isNew: true,
    features: ['100 Mbps Speed', '30 Days Validity', '24/7 Support', 'Free Router', 'Priority Support'],
  },
];

export const mockTickets: Ticket[] = [
  {
    id: '1',
    number: '#233',
    title: 'Link down',
    category: 'technical',
    priority: 'high',
    status: 'pending',
    date: '2024-01-15',
    messages: [
      { id: '1', content: 'My internet connection is down since morning', isCustomer: true, timestamp: '2024-01-15T09:00:00Z' },
      { id: '2', content: 'We are checking the issue. Please wait.', isCustomer: false, timestamp: '2024-01-15T09:30:00Z' },
    ],
  },
  {
    id: '2',
    number: '#219',
    title: 'Ping loss',
    category: 'technical',
    priority: 'medium',
    status: 'cancelled',
    date: '2024-01-12',
    messages: [
      { id: '1', content: 'Getting high ping in games', isCustomer: true, timestamp: '2024-01-12T14:00:00Z' },
    ],
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-1203',
    customerId: '1',
    customerName: 'John Doe',
    amount: 950,
    dueDate: '2024-01-18',
    status: 'open',
    items: [{ description: 'Standard Package - 50 Mbps', amount: 950 }],
  },
  {
    id: 'INV-1187',
    customerId: '1',
    customerName: 'John Doe',
    amount: 950,
    dueDate: '2023-12-15',
    status: 'paid',
    items: [{ description: 'Standard Package - 50 Mbps', amount: 950 }],
  },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Scheduled Maintenance',
    message: 'Network maintenance scheduled for tonight 2-4 AM',
    date: '2024-01-15',
    isRead: false,
    type: 'maintenance',
  },
  {
    id: '2',
    title: 'Bill Due Reminder',
    message: 'Your monthly bill of ৳950 is due in 3 days',
    date: '2024-01-14',
    isRead: true,
    type: 'billing',
  },
];

export const mockCustomerProfile = {
  loginId: 'SKY001234',
  clientCode: 'C001234',
  mobile: '01700000000',
  joiningDate: '2023-06-15',
  uptime: '99.8%',
  lastLogout: '2024-01-14 23:45',
  mac: '00:1B:44:11:3A:B7',
  ip: '192.168.1.100',
  deviceVendor: 'TP-Link',
  connectivity: 'Active',
  zone: 'Dhaka North',
  subzone: 'Gulshan',
};