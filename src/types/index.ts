export type UserRole = 'customer' | 'admin';

export type ConnectionStatus = 'connected' | 'expiring' | 'past_due' | 'suspended';

export type TicketStatus = 'pending' | 'resolved' | 'cancelled';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type InvoiceStatus = 'paid' | 'open' | 'overdue';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone?: string;
  email?: string;
  loginId?: string;
  clientCode?: string;
  avatar?: string;
}

export interface Package {
  id: string;
  name: string;
  speed: number;
  validity: number;
  price: number;
  isPopular?: boolean;
  isNew?: boolean;
  features: string[];
}

export interface Ticket {
  id: string;
  number: string;
  title: string;
  category: 'billing' | 'technical' | 'other';
  priority: TicketPriority;
  status: TicketStatus;
  date: string;
  customerId?: string;
  customerName?: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  content: string;
  isCustomer: boolean;
  timestamp: string;
  attachments?: string[];
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'maintenance' | 'billing' | 'general';
}