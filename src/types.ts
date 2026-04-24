export type DocumentType = 'bill' | 'challan' | 'quotation' | 'charge' | 'payment';

export interface LineItem {
  desc: string;
  qty: number;
  price: number;
  deliveryPeriod?: string;
}

export interface BillingDocument {
  id?: string;
  type: DocumentType;
  refNo: string;
  date: string;
  poNo?: string;
  deliveryPeriod?: string;
  customer: string;
  items: LineItem[];
  terms?: string;
  notes?: string;
  currency: string;
  total: number;
  showLogo?: boolean;
  showWatermark?: boolean;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  billCounter: number;
  challanCounter: number;
  quoteCounter: number;
  chargeCounter: number;
  paymentCounter: number;
  currency: string;
  theme: 'dark' | 'light';
  defaultTerms: string;
  backupEmail: string;
}
