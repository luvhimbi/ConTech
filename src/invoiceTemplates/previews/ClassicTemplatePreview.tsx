// src/invoiceTemplates/previews/ClassicTemplatePreview.tsx
import React, { useMemo, useState } from "react";
import type { TemplateRenderProps } from "../invoiceTemplates";

export const ClassicTemplatePreview: React.FC<TemplateRenderProps> = ({
                                                                          invoice,
                                                                          company,
                                                                          projectName,
                                                                          currencySymbol = "R",
                                                                      }) => {
    const [logoOk, setLogoOk] = useState(true);

    const logoUrl =
        (company as any)?.logoUrl ||
        (company as any)?.branding?.logoUrl ||
        null;

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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const statusColor = {
        pending: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
        paid: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
        cancelled: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
    };

    const status = (invoice as any).status || "pending";
    const colors = statusColor[status as keyof typeof statusColor] || statusColor.pending;

    return (
        <div
            style={{
                width: 850,
                maxWidth: "100%",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
                fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                margin: "0 auto",
            }}
        >
            {/* Professional Header with Accent Line */}
            <div
                style={{
                    background: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
                    padding: "32px 40px",
                    position: "relative",
                }}
            >
                {/* Accent line */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                    }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
                    {/* Company Info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                            {logoUrl && logoOk ? (
                                <div
                                    style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 12,
                                        background: "rgba(255,255,255,0.08)",
                                        border: "1px solid rgba(255,255,255,0.15)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        flex: "0 0 auto",
                                    }}
                                >
                                    <img
                                        src={logoUrl}
                                        alt="Company logo"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                            padding: 6,
                                            display: "block",
                                        }}
                                        onError={() => setLogoOk(false)}
                                    />
                                </div>
                            ) : null}

                            <div
                                style={{
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    letterSpacing: "-0.5px",
                                    marginBottom: 0,
                                }}
                            >
                                {company.companyName ||
                                    `${company.firstName} ${company.lastName}`.trim() ||
                                    "Your Business"}
                            </div>
                        </div>

                        <div style={{ color: "#D1D5DB", fontSize: 14, lineHeight: 1.6 }}>
                            {company.email}
                        </div>

                        {projectName && (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: "6px 12px",
                                    background: "rgba(59, 130, 246, 0.15)",
                                    border: "1px solid rgba(59, 130, 246, 0.3)",
                                    borderRadius: 6,
                                    display: "inline-block",
                                }}
                            >
                                <span style={{ color: "#93C5FD", fontSize: 12, fontWeight: 600 }}>
                                    Project: {projectName}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Invoice Title & Number */}
                    <div style={{ textAlign: "right" }}>
                        <div
                            style={{
                                fontSize: 42,
                                fontWeight: 800,
                                color: "#FFFFFF",
                                letterSpacing: "2px",
                                lineHeight: 1,
                            }}
                        >
                            INVOICE
                        </div>
                        <div
                            style={{
                                marginTop: 12,
                                padding: "8px 16px",
                                background: "rgba(255, 255, 255, 0.1)",
                                borderRadius: 8,
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                            }}
                        >
                            <div style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 4 }}>
                                Invoice Number
                            </div>
                            <div style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700 }}>
                                {(invoice as any).invoiceNumber || invoice.id}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date & Status Bar */}
            <div
                style={{
                    padding: "24px 40px",
                    background: "#F9FAFB",
                    borderBottom: "1px solid #E5E7EB",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <div style={{ display: "flex", gap: 32 }}>
                    <div>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
                            ISSUE DATE
                        </div>
                        <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>
                            {formatDate(issuedDate)}
                        </div>
                    </div>
                    {dueDate && (
                        <div>
                            <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
                                DUE DATE
                            </div>
                            <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>
                                {formatDate(dueDate)}
                            </div>
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: "8px 20px",
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 999,
                        color: colors.text,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                    }}
                >
                    {status}
                </div>
            </div>

            {/* Bill To & Bill From Section */}
            <div
                style={{
                    padding: "32px 40px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 40,
                    borderBottom: "1px solid #E5E7EB",
                }}
            >
                {/* Bill To */}
                <div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#6B7280",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            marginBottom: 12,
                            textTransform: "uppercase",
                        }}
                    >
                        Bill To
                    </div>
                    <div
                        style={{
                            padding: 20,
                            background: "#F9FAFB",
                            borderRadius: 12,
                            border: "1px solid #E5E7EB",
                        }}
                    >
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
                            {(invoice as any).clientName}
                        </div>
                        <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7 }}>
                            {(invoice as any).clientEmail}
                        </div>
                        {(invoice as any).clientAddress && (
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "#4B5563",
                                    marginTop: 8,
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.7,
                                }}
                            >
                                {(invoice as any).clientAddress}
                            </div>
                        )}
                        {(invoice as any).clientPhone && (
                            <div style={{ fontSize: 13, color: "#4B5563", marginTop: 6 }}>
                                {(invoice as any).clientPhone}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bill From */}
                {(invoice as any).billing && (
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                color: "#6B7280",
                                fontWeight: 700,
                                letterSpacing: "1px",
                                marginBottom: 12,
                                textTransform: "uppercase",
                            }}
                        >
                            From
                        </div>
                        <div
                            style={{
                                padding: 20,
                                background: "#F9FAFB",
                                borderRadius: 12,
                                border: "1px solid #E5E7EB",
                            }}
                        >
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
                                {(invoice as any).billing.businessName}
                            </div>
                            {(invoice as any).billing.contactName && (
                                <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7 }}>
                                    {(invoice as any).billing.contactName}
                                </div>
                            )}
                            {(invoice as any).billing.email && (
                                <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7 }}>
                                    {(invoice as any).billing.email}
                                </div>
                            )}
                            {(invoice as any).billing.phone && (
                                <div style={{ fontSize: 13, color: "#4B5563", marginTop: 6 }}>
                                    {(invoice as any).billing.phone}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Items Table */}
            <div style={{ padding: "0 40px 32px" }}>
                <div
                    style={{
                        marginTop: 32,
                        border: "1px solid #E5E7EB",
                        borderRadius: 12,
                        overflow: "hidden",
                    }}
                >
                    {/* Table Header */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 100px 140px 140px",
                            gap: 16,
                            padding: "16px 20px",
                            background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#374151",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                        }}
                    >
                        <div>Description</div>
                        <div style={{ textAlign: "center" }}>Quantity</div>
                        <div style={{ textAlign: "right" }}>Unit Price</div>
                        <div style={{ textAlign: "right" }}>Amount</div>
                    </div>

                    {/* Table Rows */}
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
                                    padding: "18px 20px",
                                    borderTop: idx > 0 ? "1px solid #F3F4F6" : "none",
                                    background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                                    fontSize: 13,
                                }}
                            >
                                <div style={{ color: "#111827", fontWeight: 600, lineHeight: 1.5 }}>
                                    {it.description}
                                </div>
                                <div style={{ textAlign: "center", color: "#4B5563", fontWeight: 500 }}>
                                    {qty}
                                </div>
                                <div style={{ textAlign: "right", color: "#4B5563", fontWeight: 500 }}>
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

                {/* Totals Section */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                    <div style={{ width: 380 }}>
                        <div
                            style={{
                                padding: 20,
                                background: "#F9FAFB",
                                borderRadius: 12,
                                border: "1px solid #E5E7EB",
                            }}
                        >
                            <TotalRow label="Subtotal" value={`${currencySymbol}${totals.subtotal.toFixed(2)}`} />
                            <TotalRow
                                label={`Tax (${totals.taxRate}%)`}
                                value={`${currencySymbol}${totals.taxAmount.toFixed(2)}`}
                            />
                            <div style={{ height: 1, background: "#D1D5DB", margin: "16px 0" }} />
                            <TotalRow
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
                            marginTop: 20,
                            padding: 16,
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: "#3B82F6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                color: "#FFFFFF",
                                fontWeight: 800,
                            }}
                        >
                            D
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 2 }}>
                                Deposit Required
                            </div>
                            <div style={{ fontSize: 12, color: "#1E3A8A" }}>
                                {currencySymbol}
                                {Number((invoice as any).deposit.amount || 0).toFixed(2)} (
                                {Number((invoice as any).deposit.ratePercent || 0)}%)
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
                            padding: 24,
                            background: "#FFFFFF",
                            border: "2px dashed #D1D5DB",
                            borderRadius: 12,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#111827",
                                marginBottom: 16,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            Payment Details
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "12px 24px",
                                fontSize: 13,
                                lineHeight: 1.6,
                            }}
                        >
                            <PaymentRow label="Bank Name" value={(invoice as any).billing.bankName} />
                            <PaymentRow label="Account Name" value={(invoice as any).billing.accountName} />
                            <PaymentRow label="Account Number" value={(invoice as any).billing.accountNumber} />
                            <PaymentRow label="Branch Code" value={(invoice as any).billing.branchCode} />
                            <PaymentRow label="Account Type" value={(invoice as any).billing.accountType || "N/A"} />
                            <PaymentRow
                                label="Reference"
                                value={(invoice as any).billing.paymentReferenceNote || "Use invoice number"}
                            />
                        </div>
                    </div>
                )}

                {/* Footer Note */}
                <div
                    style={{
                        marginTop: 32,
                        paddingTop: 24,
                        borderTop: "1px solid #E5E7EB",
                        textAlign: "center",
                        fontSize: 12,
                        color: "#6B7280",
                        lineHeight: 1.6,
                    }}
                >
                    Thank you for your business! If you have any questions about this invoice, please contact us.
                </div>
            </div>
        </div>
    );
};

const TotalRow: React.FC<{
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
                fontSize: large ? 15 : 13,
                color: bold ? "#111827" : "#4B5563",
                fontWeight: bold ? 700 : 600,
            }}
        >
            {label}
        </div>
        <div
            style={{
                fontSize: large ? 20 : 14,
                color: "#111827",
                fontWeight: bold ? 800 : 700,
            }}
        >
            {value}
        </div>
    </div>
);

const PaymentRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <div style={{ color: "#6B7280", fontWeight: 600, fontSize: 11, marginBottom: 3 }}>{label}</div>
        <div style={{ color: "#111827", fontWeight: 600 }}>{value}</div>
    </div>
);
