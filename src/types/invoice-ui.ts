import type {InvoiceStatus, InvoiceTemplateId} from "../services/invoiceService";

export type MilestoneStatus = "not_started" | "in_progress" | "completed";

export type MilestoneItem = {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

export type Milestone = {
    title: string;
    description: string;
    dueDate: string;
    status: MilestoneStatus;
    items: MilestoneItem[];
};

export type BillingDetails = {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;

    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    accountType: string;
    paymentReferenceNote: string;
};

export type InvoiceFormData = {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    clientPhone: string;
    taxRate: number;
    dueDate: string;
    status: InvoiceStatus;
    templateId: InvoiceTemplateId;
};
