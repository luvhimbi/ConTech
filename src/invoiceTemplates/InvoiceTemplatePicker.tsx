// src/invoiceTemplates/InvoiceTemplatePicker.tsx
import React, { useMemo, useState } from "react";
import type { Invoice } from "../services/invoiceService";
import type { InvoiceTemplateId } from "./invoiceTemplates";
import { INVOICE_TEMPLATES } from "./invoiceTemplates";

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect: (templateId: InvoiceTemplateId) => void;

    invoiceForPreview: Invoice; // can be real invoice or sample
    company: {
        firstName: string;
        lastName: string;
        companyName: string;
        email: string;
    };
    projectName?: string;
    selectedTemplateId?: InvoiceTemplateId;
};

export const InvoiceTemplatePicker: React.FC<Props> = ({
                                                           open,
                                                           onClose,
                                                           onSelect,
                                                           invoiceForPreview,
                                                           company,
                                                           projectName,
                                                           selectedTemplateId = "classic",
                                                       }) => {
    const [active, setActive] = useState<InvoiceTemplateId>(selectedTemplateId);

    const activeTemplate = useMemo(
        () => INVOICE_TEMPLATES.find((t) => t.id === active) || INVOICE_TEMPLATES[0],
        [active]
    );

    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "min(1200px, 96vw)",
                    maxHeight: "92vh",
                    background: "#fff",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left: list */}
                <div style={{ width: 320, borderRight: "1px solid #e5e7eb" }}>
                    <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: 16, fontWeight: 900 }}>Choose Invoice Template</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            Preview then select the template for your invoice PDF.
                        </div>
                    </div>

                    <div style={{ padding: 12, display: "grid", gap: 10 }}>
                        {INVOICE_TEMPLATES.map((t) => {
                            const isActive = t.id === active;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActive(t.id)}
                                    style={{
                                        textAlign: "left",
                                        padding: 12,
                                        borderRadius: 12,
                                        border: isActive ? "2px solid #111827" : "1px solid #e5e7eb",
                                        background: isActive ? "#f9fafb" : "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>{t.name}</div>
                                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{t.description}</div>
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ padding: 12, borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                cursor: "pointer",
                                fontWeight: 800,
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={() => onSelect(active)}
                            style={{
                                flex: 1,
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid #111827",
                                background: "#111827",
                                color: "#fff",
                                cursor: "pointer",
                                fontWeight: 900,
                            }}
                        >
                            Use Template
                        </button>
                    </div>
                </div>

                {/* Right: preview */}
                <div style={{ flex: 1, background: "#f3f4f6", padding: 16, overflow: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <activeTemplate.PreviewComponent
                            invoice={invoiceForPreview}
                            company={company}
                            projectName={projectName}
                            currencySymbol="R"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
