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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

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

    const statusStyles = {
        pending: {
            bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            text: "#92400E",
            border: "#F59E0B",
        },
        paid: {
            bg: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
            text: "#065F46",
            border: "#10B981",
        },
        cancelled: {
            bg: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
            text: "#991B1B",
            border: "#EF4444",
        },
    };

    const status = (invoice as any).status || "pending";
    const statusStyle = statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;

    return (
        <div
            style={{
                width: 850,
                maxWidth: "100%",
                background: "#FFFFFF",
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid #E5E7EB",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                margin: "0 auto",
            }}
        >
            {/* Modern Gradient Header */}
            <div
                style={{
                    padding: "40px 48px",
                    background: "linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative circles */}
                <div
                    style={{
                        position: "absolute",
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.1)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -30,
                        left: -30,
                        width: 150,
                        height: 150,
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.08)",
                    }}
                />

                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    {/* Company Info */}
                    <div>
                        <div
                            style={{
                                fontSize: 26,
                                fontWeight: 800,
                                color: "#FFFFFF",
                                letterSpacing: "-0.5px",
                                marginBottom: 8,
                                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            {company.companyName ||
                                `${company.firstName} ${company.lastName}`.trim() ||
                                "Your Business"}
                        </div>
                        <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 14, marginBottom: 4 }}>
                            {company.email}
                        </div>
                        {projectName && (
                            <div
                                style={{
                                    marginTop: 12,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 14px",
                                    background: "rgba(255, 255, 255, 0.2)",
                                    backdropFilter: "blur(10px)",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255, 255, 255, 0.3)",
                                }}
                            >
                                <span style={{ fontSize: 16 }}>📁</span>
                                <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>
                  {projectName}
                </span>
                            </div>
                        )}
                    </div>

                    {/* Invoice Title */}
                    <div style={{ textAlign: "right" }}>
                        <div
                            style={{
                                fontSize: 48,
                                fontWeight: 900,
                                color: "#FFFFFF",
                                letterSpacing: "3px",
                                lineHeight: 1,
                                textShadow: "0 4px 6px rgba(0, 0, 0, 0.15)",
                            }}
                        >
                            INVOICE
                        </div>
                        <div
                            style={{
                                marginTop: 16,
                                padding: "10px 20px",
                                background: "rgba(255, 255, 255, 0.15)",
                                backdropFilter: "blur(10px)",
                                borderRadius: 10,
                                border: "1px solid rgba(255, 255, 255, 0.25)",
                            }}
                        >
                            <div
                                style={{
                                    color: "rgba(255, 255, 255, 0.8)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    marginBottom: 4,
                                }}
                            >
                                #
                            </div>
                            <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700 }}>
                                {(invoice as any).invoiceNumber || invoice.id}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards Section */}
            <div style={{ padding: "40px 48px" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 20,
                        marginBottom: 32,
                    }}
                >
                    {/* Bill To Card */}
                    <div
                        style={{
                            padding: 20,
                            background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
                            borderRadius: 14,
                            border: "1px solid #E5E7EB",
                            gridColumn: "span 2",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#6B7280",
                                letterSpacing: "1px",
                                marginBottom: 12,
                                textTransform: "uppercase",
                            }}
                        >
                            Bill To
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
                            {(invoice as any).clientName}
                        </div>
                        <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7 }}>
                            {(invoice as any).clientEmail}
                        </div>
                        {(invoice as any).clientAddress && (
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "#6B7280",
                                    marginTop: 8,
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.7,
                                }}
                            >
                                {(invoice as any).clientAddress}
                            </div>
                        )}
                        {(invoice as any).clientPhone && (
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 13,
                                    color: "#4B5563",
                                    fontWeight: 600,
                                }}
                            >
                                📞 {(invoice as any).clientPhone}
                            </div>
                        )}
                    </div>

                    {/* Total Due Card */}
                    <div
                        style={{
                            padding: 24,
                            background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
                            borderRadius: 14,
                            border: "1px solid rgba(102, 126, 234, 0.3)",
                            boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "rgba(255, 255, 255, 0.8)",
                                letterSpacing: "1px",
                                marginBottom: 8,
                                textTransform: "uppercase",
                            }}
                        >
                            Total Due
                        </div>
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 900,
                                color: "#FFFFFF",
                                letterSpacing: "-1px",
                                marginBottom: 12,
                            }}
                        >
                            {currencySymbol}
                            {totals.totalAmount.toFixed(2)}
                        </div>
                        <div
                            style={{
                                padding: "6px 12px",
                                background: statusStyle.bg,
                                border: `1px solid ${statusStyle.border}`,
                                borderRadius: 8,
                                color: statusStyle.text,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                textAlign: "center",
                            }}
                        >
                            {status}
                        </div>
                    </div>
                </div>

                {/* Date Info */}
                <div
                    style={{
                        display: "flex",
                        gap: 24,
                        marginBottom: 32,
                        padding: "16px 20px",
                        background: "#FAFAFA",
                        borderRadius: 12,
                        border: "1px solid #F3F4F6",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 11,
                                color: "#6B7280",
                                fontWeight: 700,
                                marginBottom: 6,
                                textTransform: "uppercase",
                            }}
                        >
                            Issue Date
                        </div>
                        <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>
                            {formatDate(issuedDate)}
                        </div>
                    </div>
                    {dueDate && (
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "#6B7280",
                                    fontWeight: 700,
                                    marginBottom: 6,
                                    textTransform: "uppercase",
                                }}
                            >
                                Due Date
                            </div>
                            <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>
                                {formatDate(dueDate)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modern Items Table */}
                <div
                    style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 24,
                    }}
                >
                    {/* Table Header */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 100px 140px 140px",
                            gap: 16,
                            padding: "18px 24px",
                            background: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        <div>Description</div>
                        <div style={{ textAlign: "center" }}>Qty</div>
                        <div style={{ textAlign: "right" }}>Rate</div>
                        <div style={{ textAlign: "right" }}>Amount</div>
                    </div>

                    {/* Table Body */}
                    {(invoice.items || []).map((it: any, idx: number) => {
                        const qty = Number(it.quantity) || 0;
                        const price = Number(it.unitPrice) || 0;
                        const lineTotal = qty * price;

                        return (
                            <div
                                key={idx}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 100px 140px 140px",
                                    gap: 16,
                                    padding: "20px 24px",
                                    borderTop: "1px solid #F3F4F6",
                                    background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                                    fontSize: 14,
                                }}
                            >
                                <div style={{ color: "#111827", fontWeight: 600, lineHeight: 1.5 }}>
                                    {it.description}
                                </div>
                                <div
                                    style={{
                                        textAlign: "center",
                                        color: "#4B5563",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                  <span
                      style={{
                          padding: "4px 12px",
                          background: "#F3F4F6",
                          borderRadius: 6,
                          fontSize: 13,
                      }}
                  >
                    {qty}
                  </span>
                                </div>
                                <div style={{ textAlign: "right", color: "#6B7280", fontWeight: 500 }}>
                                    {currencySymbol}
                                    {price.toFixed(2)}
                                </div>
                                <div style={{ textAlign: "right", color: "#111827", fontWeight: 700 }}>
                                    {currencySymbol}
                                    {lineTotal.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: 400 }}>
                        <div
                            style={{
                                padding: 24,
                                background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
                                borderRadius: 14,
                                border: "1px solid #E5E7EB",
                            }}
                        >
                            <SummaryRow
                                label="Subtotal"
                                value={`${currencySymbol}${totals.subtotal.toFixed(2)}`}
                            />
                            <SummaryRow
                                label={`Tax (${totals.taxRate}%)`}
                                value={`${currencySymbol}${totals.taxAmount.toFixed(2)}`}
                            />
                            <div
                                style={{
                                    height: 2,
                                    background: "linear-gradient(90deg, #667EEA 0%, #764BA2 100%)",
                                    margin: "16px 0",
                                    borderRadius: 2,
                                }}
                            />
                            <SummaryRow
                                label="Total Amount"
                                value={`${currencySymbol}${totals.totalAmount.toFixed(2)}`}
                                bold
                                large
                            />
                        </div>
                    </div>
                </div>

                {/* Deposit Notice */}
                {(invoice as any).deposit?.enabled && (
                    <div
                        style={{
                            marginTop: 24,
                            padding: 20,
                            background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                            border: "2px solid #3B82F6",
                            borderRadius: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 24,
                                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                            }}
                        >
                            💰
                        </div>
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#1E40AF",
                                    marginBottom: 4,
                                }}
                            >
                                Deposit Required
                            </div>
                            <div style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 1.6 }}>
                                {currencySymbol}
                                {Number((invoice as any).deposit.amount || 0).toFixed(2)} (
                                {Number((invoice as any).deposit.ratePercent || 0)}% of total)
                                {(invoice as any).deposit.dueDate && (
                                    <>
                                        {" "}
                                        • Due by{" "}
                                        {formatDate(
                                            (invoice as any).deposit.dueDate?.toDate
                                                ? (invoice as any).deposit.dueDate.toDate()
                                                : new Date((invoice as any).deposit.dueDate)
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Details */}
                {(invoice as any).billing?.bankName && (
                    <div
                        style={{
                            marginTop: 32,
                            padding: 28,
                            background: "#FFFFFF",
                            border: "2px dashed #D1D5DB",
                            borderRadius: 14,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#111827",
                                marginBottom: 20,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <span style={{ fontSize: 20 }}>💳</span>
                            <span>Payment Information</span>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "16px 32px",
                            }}
                        >
                            <DetailRow label="Bank Name" value={(invoice as any).billing.bankName} />
                            <DetailRow label="Account Name" value={(invoice as any).billing.accountName} />
                            <DetailRow label="Account Number" value={(invoice as any).billing.accountNumber} />
                            <DetailRow label="Branch Code" value={(invoice as any).billing.branchCode} />
                            <DetailRow
                                label="Account Type"
                                value={(invoice as any).billing.accountType || "N/A"}
                            />
                            <DetailRow
                                label="Payment Reference"
                                value={(invoice as any).billing.paymentReferenceNote || "Use invoice number"}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div
                    style={{
                        marginTop: 40,
                        paddingTop: 24,
                        borderTop: "2px solid #F3F4F6",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.8 }}>
                        Thank you for your business! For any questions regarding this invoice,
                        <br />
                        please contact us at {company.email}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryRow: React.FC<{
    label: string;
    value: string;
    bold?: boolean;
    large?: boolean;
}> = ({ label, value, bold, large }) => (
    <div
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: large ? 0 : 12,
        }}
    >
        <div
            style={{
                fontSize: large ? 16 : 13,
                color: bold ? "#111827" : "#6B7280",
                fontWeight: bold ? 700 : 600,
            }}
        >
            {label}
        </div>
        <div
            style={{
                fontSize: large ? 24 : 15,
                color: "#111827",
                fontWeight: bold ? 900 : 700,
            }}
        >
            {value}
        </div>
    </div>
);

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <div
            style={{
                fontSize: 11,
                color: "#9CA3AF",
                fontWeight: 700,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
            }}
        >
            {label}
        </div>
        <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{value}</div>
    </div>
);