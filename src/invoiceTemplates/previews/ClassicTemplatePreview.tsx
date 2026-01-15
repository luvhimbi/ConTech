// src/invoiceTemplates/previews/ClassicTemplatePreview.tsx
import React, { useMemo } from "react";
import type { TemplateRenderProps } from "../invoiceTemplates";

export const ClassicTemplatePreview: React.FC<TemplateRenderProps> = ({
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
        const totalAmount = subtotal + taxAmount;

        return { subtotal, taxAmount, totalAmount, taxRate };
    }, [invoice]);

    const issuedDate = (() => {
        const raw = (invoice as any).createdAt;
        try {
            if (raw?.toDate) return raw.toDate();
            return raw ? new Date(raw) : new Date();
        } catch {
            return new Date();
        }
    })();

    const dueDate = (() => {
        const raw = (invoice as any).dueDate;
        if (!raw) return null;
        try {
            if (raw?.toDate) return raw.toDate();
            return new Date(raw);
        } catch {
            return null;
        }
    })();

    return (
        <div
            style={{
                width: 820,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
            }}
        >
            {/* Header */}
            <div style={{ padding: 24, borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>
                            {company.companyName || `${company.firstName} ${company.lastName}`.trim() || "Your Business"}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{company.email}</div>
                        {projectName ? (
                            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                                Project: <span style={{ color: "#111827" }}>{projectName}</span>
                            </div>
                        ) : null}
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 0.5 }}>INVOICE</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                            No: <span style={{ color: "#111827", fontWeight: 700 }}>{(invoice as any).invoiceNumber || invoice.id}</span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                            Issued: <span style={{ color: "#111827" }}>{issuedDate.toLocaleDateString()}</span>
                        </div>
                        {dueDate ? (
                            <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                                Due: <span style={{ color: "#111827" }}>{dueDate.toLocaleDateString()}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Bill to */}
            <div style={{ padding: 24, display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Bill To</div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{(invoice as any).clientName}</div>
                    <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{(invoice as any).clientEmail}</div>
                    {(invoice as any).clientAddress ? (
                        <div style={{ fontSize: 12, color: "#374151", marginTop: 4, whiteSpace: "pre-wrap" }}>
                            {(invoice as any).clientAddress}
                        </div>
                    ) : null}
                    {(invoice as any).clientPhone ? (
                        <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                            {(invoice as any).clientPhone}
                        </div>
                    ) : null}
                </div>

                <div style={{ minWidth: 220 }}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Status</div>
                    <div
                        style={{
                            display: "inline-flex",
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            border: "1px solid #e5e7eb",
                        }}
                    >
                        {String((invoice as any).status || "pending").toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div style={{ padding: "0 24px 24px" }}>
                <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", background: "#f9fafb", padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>
                        <div style={{ flex: 2, fontWeight: 800 }}>Description</div>
                        <div style={{ width: 70, textAlign: "right", fontWeight: 800 }}>Qty</div>
                        <div style={{ width: 120, textAlign: "right", fontWeight: 800 }}>Unit</div>
                        <div style={{ width: 140, textAlign: "right", fontWeight: 800 }}>Total</div>
                    </div>

                    {(invoice.items || []).map((it: any, idx: number) => {
                        const qty = Number(it.quantity) || 0;
                        const price = Number(it.unitPrice) || 0;
                        const lineTotal = qty * price;

                        return (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    padding: "12px 14px",
                                    borderTop: "1px solid #eee",
                                    fontSize: 12,
                                }}
                            >
                                <div style={{ flex: 2, color: "#111827", fontWeight: 600 }}>{it.description}</div>
                                <div style={{ width: 70, textAlign: "right", color: "#111827" }}>{qty}</div>
                                <div style={{ width: 120, textAlign: "right", color: "#111827" }}>
                                    {currencySymbol}
                                    {price.toFixed(2)}
                                </div>
                                <div style={{ width: 140, textAlign: "right", color: "#111827", fontWeight: 800 }}>
                                    {currencySymbol}
                                    {lineTotal.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <div style={{ width: 340 }}>
                        <Row label="Subtotal" value={`${currencySymbol}${totals.subtotal.toFixed(2)}`} />
                        <Row label={`Tax (${totals.taxRate}%)`} value={`${currencySymbol}${totals.taxAmount.toFixed(2)}`} />
                        <div style={{ height: 1, background: "#eee", margin: "10px 0" }} />
                        <Row
                            label="Total"
                            value={`${currencySymbol}${totals.totalAmount.toFixed(2)}`}
                            bold
                            big
                        />
                    </div>
                </div>

                {/* Optional deposit */}
                {(invoice as any).deposit?.enabled ? (
                    <div style={{ marginTop: 14, fontSize: 12, color: "#374151" }}>
                        Deposit Required:{" "}
                        <strong>
                            {currencySymbol}
                            {Number((invoice as any).deposit.amount || 0).toFixed(2)}
                        </strong>{" "}
                        ({Number((invoice as any).deposit.ratePercent || 0)}%)
                    </div>
                ) : null}

                {/* Optional payment details */}
                {(invoice as any).billing?.bankName ? (
                    <div style={{ marginTop: 18, padding: 14, border: "1px dashed #d1d5db", borderRadius: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Payment Details</div>
                        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                            Bank: {(invoice as any).billing.bankName}
                            <br />
                            Account Name: {(invoice as any).billing.accountName}
                            <br />
                            Account Number: {(invoice as any).billing.accountNumber}
                            <br />
                            Branch Code: {(invoice as any).billing.branchCode}
                            <br />
                            Account Type: {(invoice as any).billing.accountType}
                            <br />
                            Reference: {(invoice as any).billing.paymentReferenceNote || "Use invoice number"}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean; big?: boolean }> = ({
                                                                                            label,
                                                                                            value,
                                                                                            bold,
                                                                                            big,
                                                                                        }) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ fontSize: big ? 14 : 12, color: "#6b7280", fontWeight: bold ? 800 : 600 }}>
            {label}
        </div>
        <div style={{ fontSize: big ? 16 : 12, color: "#111827", fontWeight: bold ? 900 : 700 }}>
            {value}
        </div>
    </div>
);
