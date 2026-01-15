// src/invoiceTemplates/previews/ModernTemplatePreview.tsx
import React, { useMemo } from "react";
import type { TemplateRenderProps } from "../invoiceTemplates";

export const ModernTemplatePreview: React.FC<TemplateRenderProps> = ({
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
        <div style={{ width: 820, background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <div style={{ padding: 26, background: "#111827", color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>
                            {company.companyName || `${company.firstName} ${company.lastName}`.trim() || "Your Business"}
                        </div>
                        <div style={{ opacity: 0.85, fontSize: 12, marginTop: 6 }}>{company.email}</div>
                        {projectName ? <div style={{ opacity: 0.85, fontSize: 12, marginTop: 6 }}>Project: {projectName}</div> : null}
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: 1 }}>INVOICE</div>
                        <div style={{ opacity: 0.85, fontSize: 12, marginTop: 8 }}>
                            {(invoice as any).invoiceNumber || invoice.id}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: 26 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
                    <div>
                        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>BILL TO</div>
                        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 900, color: "#111827" }}>{(invoice as any).clientName}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: "#374151" }}>{(invoice as any).clientEmail}</div>
                        {(invoice as any).clientAddress ? (
                            <div style={{ marginTop: 6, fontSize: 12, color: "#374151", whiteSpace: "pre-wrap" }}>
                                {(invoice as any).clientAddress}
                            </div>
                        ) : null}
                    </div>

                    <div style={{ minWidth: 260 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
                            <span style={{ fontWeight: 800 }}>Status</span>
                            <span style={{ fontWeight: 900, color: "#111827" }}>
                {String((invoice as any).status || "pending").toUpperCase()}
              </span>
                        </div>
                        <div style={{ marginTop: 12, padding: 14, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>TOTAL DUE</div>
                            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 1000, color: "#111827" }}>
                                {currencySymbol}
                                {totals.totalAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 18, border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", padding: "10px 12px", background: "#f3f4f6", fontSize: 12, color: "#6b7280" }}>
                        <div style={{ flex: 2, fontWeight: 900 }}>Description</div>
                        <div style={{ width: 70, textAlign: "right", fontWeight: 900 }}>Qty</div>
                        <div style={{ width: 120, textAlign: "right", fontWeight: 900 }}>Unit</div>
                        <div style={{ width: 140, textAlign: "right", fontWeight: 900 }}>Total</div>
                    </div>

                    {(invoice.items || []).map((it: any, idx: number) => {
                        const qty = Number(it.quantity) || 0;
                        const price = Number(it.unitPrice) || 0;
                        const lineTotal = qty * price;
                        return (
                            <div key={idx} style={{ display: "flex", padding: "10px 12px", borderTop: "1px solid #e5e7eb", fontSize: 12 }}>
                                <div style={{ flex: 2, fontWeight: 600, color: "#111827" }}>{it.description}</div>
                                <div style={{ width: 70, textAlign: "right" }}>{qty}</div>
                                <div style={{ width: 120, textAlign: "right" }}>
                                    {currencySymbol}
                                    {price.toFixed(2)}
                                </div>
                                <div style={{ width: 140, textAlign: "right", fontWeight: 900 }}>
                                    {currencySymbol}
                                    {lineTotal.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <div style={{ width: 340 }}>
                        <Row label="Subtotal" value={`${currencySymbol}${totals.subtotal.toFixed(2)}`} />
                        <Row label={`Tax (${totals.taxRate}%)`} value={`${currencySymbol}${totals.taxAmount.toFixed(2)}`} />
                        <div style={{ height: 1, background: "#e5e7eb", margin: "10px 0" }} />
                        <Row label="Total" value={`${currencySymbol}${totals.totalAmount.toFixed(2)}`} bold />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#111827", fontWeight: bold ? 1000 : 800 }}>{value}</div>
    </div>
);
