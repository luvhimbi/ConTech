// src/invoiceTemplates/invoiceTemplates.ts
import type { Invoice } from "../services/invoiceService";

export type InvoiceTemplateId = "classic" | "modern" | "minimal";

export type TemplateRenderProps = {
    invoice: Invoice;
    company: {
        firstName: string;
        lastName: string;
        companyName: string;
        email: string;
    };
    projectName?: string;
    currencySymbol?: string; // "R"
};

export type InvoiceTemplate = {
    id: InvoiceTemplateId;
    name: string;
    description: string;
    PreviewComponent: React.FC<TemplateRenderProps>;
};

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
    {
        id: "classic",
        name: "Classic",
        description: "Traditional layout with clear totals and sections.",
        PreviewComponent: require("./previews/ClassicTemplatePreview").ClassicTemplatePreview,
    },
    {
        id: "modern",
        name: "Modern",
        description: "Bold header, clean spacing, modern invoice look.",
        PreviewComponent: require("./previews/ModernTemplatePreview").ModernTemplatePreview,
    },
    {
        id: "minimal",
        name: "Minimal",
        description: "Very simple, lightweight and compact.",
        PreviewComponent: require("./previews/MinimalTemplatePreview").MinimalTemplatePreview,
    },
];
