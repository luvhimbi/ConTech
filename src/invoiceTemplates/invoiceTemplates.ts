// src/invoiceTemplates/invoiceTemplates.ts
import type { Invoice } from "../services/invoiceService";
import type React from "react";

// ✅ Import previews properly (ES modules)
import { ClassicTemplatePreview } from "./previews/ClassicTemplatePreview";
import { ModernTemplatePreview } from "./previews/ModernTemplatePreview";
import { MinimalTemplatePreview } from "./previews/MinimalTemplatePreview";

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
        PreviewComponent: ClassicTemplatePreview,
    },
    {
        id: "modern",
        name: "Modern",
        description: "Bold header, clean spacing, modern invoice look.",
        PreviewComponent: ModernTemplatePreview,
    },
    {
        id: "minimal",
        name: "Minimal",
        description: "Very simple, lightweight and compact.",
        PreviewComponent: MinimalTemplatePreview,
    },
];
