// src/invoiceTemplates/previews/MinimalTemplatePreview.tsx
import React, { useMemo } from "react";
import type { TemplateRenderProps } from "../invoiceTemplates";

export const MinimalTemplatePreview: React.FC<TemplateRenderProps> = ({
                                                                          invoice,
                                                                          company,
                                                                          projectName,
                                                                          currencySymbol = "R",
                                                                      }) => {
    const totals = useMemo(() => {
        const subtotal = (invoice.items || []).reduce((sum: number, it: any) => {
            const qty = Number(it.quantity) || 0;
            const price = Number(it.unitPrice) || 0;
            return sum + qty * price;
        }, 0);
        const taxRate = Number((invoice as any).taxRate) || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        return { subtotal, taxAmount, totalAmount: subtotal + taxAmount, taxRate };
    }, [invoice]);

    return (
        <div style={{ width: 820, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>
                    {company.companyName || `${company.firstName} ${company.lastName}`.trim() || "Your Business"}
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginTop: 6 }}>{company.email}</div>
                    {projectName ? <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>Project: {projectName}</div> : null}
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 1000 }}>Invoice</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                        {(invoice as any).invoiceNumber || invoice.id}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                        {(invoice as any).clientName}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
                {(invoice.items || []).map((it: any, idx: number) => {
                    const qty = Number(it.quantity) || 0;
                    const price = Number(it.unitPrice) || 0;
                    const lineTotal = qty * price;
                    return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12 }}>
                            <div style={{ flex: 2, color: "#111827", fontWeight: 700 }}>
                                {it.description}{" "}
                                <span style={{ color: "#6b7280", fontWeight: 600 }}>
                  ({qty} × {currencySymbol}
                                    {price.toFixed(2)})
                </span>
                            </div>
                            <div style={{ minWidth: 140, textAlign: "right", fontWeight: 900 }}>
                                {currencySymbol}
                                {lineTotal.toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 14, display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: 320, fontSize: 12 }}>
                    <Row label="Subtotal" value={`${currencySymbol}${totals.subtotal.toFixed(2)}`} />
                    <Row label={`Tax (${totals.taxRate}%)`} value={`${currencySymbol}${totals.taxAmount.toFixed(2)}`} />
                    <Row label="Total" value={`${currencySymbol}${totals.totalAmount.toFixed(2)}`} bold />
                </div>
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ color: "#6b7280", fontWeight: 800 }}>{label}</div>
        <div style={{ color: "#111827", fontWeight: bold ? 1000 : 800 }}>{value}</div>
    </div>
);
