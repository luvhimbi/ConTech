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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
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

    const statusConfig = {
        pending: { color: "#D97706", bg: "#FEF3C7" },
        paid: { color: "#059669", bg: "#D1FAE5" },
        cancelled: { color: "#DC2626", bg: "#FEE2E2" },
    };

    const status = (invoice as any).status || "pending";
    const statusColors = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
        <div
            style={{
                width: 850,
                maxWidth: "100%",
                background: "#FFFFFF",
                border: "1px solid #000000",
                margin: "0 auto",
                fontFamily: "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
                padding: 48,
            }}
        >
            {/* Ultra Clean Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    paddingBottom: 32,
                    borderBottom: "3px solid #000000",
                    marginBottom: 32,
                }}
            >
                {/* Company Info */}
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#000000",
                            letterSpacing: "-0.5px",
                            marginBottom: 8,
                            textTransform: "uppercase",
                        }}
                    >
                        {company.companyName ||
                            `${company.firstName} ${company.lastName}`.trim() ||
                            "Your Business"}
                    </div>
                    <div style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, marginBottom: 2 }}>
                        {company.email}
                    </div>
                    {projectName && (
                        <div style={{ fontSize: 13, color: "#737373", marginTop: 6 }}>
                            Project: <span style={{ fontWeight: 600, color: "#000000" }}>{projectName}</span>
                        </div>
                    )}
                </div>

                {/* Invoice Title & Details */}
                <div style={{ textAlign: "right" }}>
                    <div
                        style={{
                            fontSize: 52,
                            fontWeight: 800,
                            color: "#000000",
                            letterSpacing: "4px",
                            lineHeight: 1,
                            marginBottom: 16,
                        }}
                    >
                        INVOICE
                    </div>
                    <div style={{ fontSize: 13, color: "#525252", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: "#000000" }}>
              {(invoice as any).invoiceNumber || invoice.id}
            </span>
                    </div>
                    <div
                        style={{
                            display: "inline-block",
                            padding: "6px 16px",
                            background: statusColors.bg,
                            border: `2px solid ${statusColors.color}`,
                            color: statusColors.color,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        {status}
                    </div>
                </div>
            </div>

            {/* Client & Date Info */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr",
                    gap: 48,
                    marginBottom: 40,
                }}
            >
                {/* Bill To */}
                <div>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#737373",
                            letterSpacing: "1.5px",
                            marginBottom: 12,
                            textTransform: "uppercase",
                        }}
                    >
                        Bill To
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#000000", marginBottom: 8 }}>
                        {(invoice as any).clientName}
                    </div>
                    <div style={{ fontSize: 13, color: "#525252", lineHeight: 1.7 }}>
                        {(invoice as any).clientEmail}
                    </div>
                    {(invoice as any).clientAddress && (
                        <div
                            style={{
                                fontSize: 13,
                                color: "#737373",
                                marginTop: 8,
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.7,
                            }}
                        >
                            {(invoice as any).clientAddress}
                        </div>
                    )}
                    {(invoice as any).clientPhone && (
                        <div style={{ fontSize: 13, color: "#525252", marginTop: 6 }}>
                            {(invoice as any).clientPhone}
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div>
                    <div style={{ marginBottom: 20 }}>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#737373",
                                letterSpacing: "1.5px",
                                marginBottom: 8,
                                textTransform: "uppercase",
                            }}
                        >
                            Issue Date
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>
                            {formatDate(issuedDate)}
                        </div>
                    </div>
                    {dueDate && (
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#737373",
                                    letterSpacing: "1.5px",
                                    marginBottom: 8,
                                    textTransform: "uppercase",
                                }}
                            >
                                Due Date
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>
                                {formatDate(dueDate)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Minimalist Items List */}
            <div style={{ marginBottom: 32 }}>
                {/* Header */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 80px 120px 120px",
                        gap: 16,
                        paddingBottom: 12,
                        borderBottom: "2px solid #000000",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#000000",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                    }}
                >
                    <div>Description</div>
                    <div style={{ textAlign: "center" }}>Qty</div>
                    <div style={{ textAlign: "right" }}>Rate</div>
                    <div style={{ textAlign: "right" }}>Amount</div>
                </div>

                {/* Items */}
                {(invoice.items || []).map((it: any, idx: number) => {
                    const qty = Number(it.quantity) || 0;
                    const price = Number(it.unitPrice) || 0;
                    const lineTotal = qty * price;

                    return (
                        <div
                            key={idx}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 80px 120px 120px",
                                gap: 16,
                                paddingTop: 16,
                                paddingBottom: 16,
                                borderBottom: "1px solid #E5E5E5",
                            }}
                        >
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#000000", lineHeight: 1.5 }}>
                                {it.description}
                            </div>
                            <div style={{ textAlign: "center", fontSize: 14, color: "#525252", fontWeight: 500 }}>
                                {qty}
                            </div>
                            <div style={{ textAlign: "right", fontSize: 14, color: "#525252" }}>
                                {currencySymbol}
                                {price.toFixed(2)}
                            </div>
                            <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: "#000000" }}>
                                {currencySymbol}
                                {lineTotal.toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
                <div style={{ width: 360 }}>
                    <TotalRow
                        label="Subtotal"
                        value={`${currencySymbol}${totals.subtotal.toFixed(2)}`}
                    />
                    <TotalRow
                        label={`Tax (${totals.taxRate}%)`}
                        value={`${currencySymbol}${totals.taxAmount.toFixed(2)}`}
                    />
                    <div
                        style={{
                            height: 3,
                            background: "#000000",
                            margin: "20px 0",
                        }}
                    />
                    <TotalRow
                        label="Total Due"
                        value={`${currencySymbol}${totals.totalAmount.toFixed(2)}`}
                        bold
                        large
                    />
                </div>
            </div>

            {/* Deposit Notice */}
            {(invoice as any).deposit?.enabled && (
                <div
                    style={{
                        marginBottom: 32,
                        padding: 20,
                        border: "2px solid #000000",
                        background: "#FAFAFA",
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#000000",
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                        }}
                    >
                        Deposit Required
                    </div>
                    <div style={{ fontSize: 14, color: "#525252", lineHeight: 1.6 }}>
                        {currencySymbol}
                        {Number((invoice as any).deposit.amount || 0).toFixed(2)} (
                        {Number((invoice as any).deposit.ratePercent || 0)}% of total amount)
                        {(invoice as any).deposit.dueDate && (
                            <>
                                <br />
                                Due by:{" "}
                                <span style={{ fontWeight: 600, color: "#000000" }}>
                  {formatDate(
                      (invoice as any).deposit.dueDate?.toDate
                          ? (invoice as any).deposit.dueDate.toDate()
                          : new Date((invoice as any).deposit.dueDate)
                  )}
                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Details */}
            {(invoice as any).billing?.bankName && (
                <div
                    style={{
                        marginBottom: 32,
                        padding: 24,
                        border: "2px solid #000000",
                        background: "#FAFAFA",
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#000000",
                            marginBottom: 16,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                        }}
                    >
                        Payment Information
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px 32px",
                        }}
                    >
                        <PaymentDetail label="Bank Name" value={(invoice as any).billing.bankName} />
                        <PaymentDetail label="Account Name" value={(invoice as any).billing.accountName} />
                        <PaymentDetail
                            label="Account Number"
                            value={(invoice as any).billing.accountNumber}
                        />
                        <PaymentDetail label="Branch Code" value={(invoice as any).billing.branchCode} />
                        <PaymentDetail
                            label="Account Type"
                            value={(invoice as any).billing.accountType || "N/A"}
                        />
                        <PaymentDetail
                            label="Reference"
                            value={(invoice as any).billing.paymentReferenceNote || "Use invoice number"}
                        />
                    </div>
                </div>
            )}

            {/* From Details */}
            {(invoice as any).billing && (
                <div
                    style={{
                        paddingTop: 24,
                        borderTop: "1px solid #E5E5E5",
                        marginBottom: 32,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#737373",
                            letterSpacing: "1.5px",
                            marginBottom: 12,
                            textTransform: "uppercase",
                        }}
                    >
                        From
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#000000", marginBottom: 6 }}>
                        {(invoice as any).billing.businessName}
                    </div>
                    {(invoice as any).billing.contactName && (
                        <div style={{ fontSize: 13, color: "#525252", marginBottom: 4 }}>
                            {(invoice as any).billing.contactName}
                        </div>
                    )}
                    {(invoice as any).billing.email && (
                        <div style={{ fontSize: 13, color: "#525252", marginBottom: 4 }}>
                            {(invoice as any).billing.email}
                        </div>
                    )}
                    {(invoice as any).billing.phone && (
                        <div style={{ fontSize: 13, color: "#525252", marginBottom: 4 }}>
                            {(invoice as any).billing.phone}
                        </div>
                    )}
                    {(invoice as any).billing.address && (
                        <div
                            style={{
                                fontSize: 13,
                                color: "#737373",
                                marginTop: 8,
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.6,
                            }}
                        >
                            {(invoice as any).billing.address}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div
                style={{
                    paddingTop: 24,
                    borderTop: "3px solid #000000",
                    textAlign: "center",
                    fontSize: 12,
                    color: "#737373",
                    lineHeight: 1.7,
                }}
            >
                Thank you for your business.
                <br />
                For questions, please contact {company.email}
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
                fontSize: large ? 16 : 13,
                color: bold ? "#000000" : "#525252",
                fontWeight: bold ? 700 : 600,
                textTransform: bold ? "uppercase" : "none",
                letterSpacing: bold ? "1px" : "0",
            }}
        >
            {label}
        </div>
        <div
            style={{
                fontSize: large ? 28 : 15,
                color: "#000000",
                fontWeight: bold ? 800 : 700,
            }}
        >
            {value}
        </div>
    </div>
);

const PaymentDetail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <div
            style={{
                fontSize: 11,
                color: "#737373",
                fontWeight: 700,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "1px",
            }}
        >
            {label}
        </div>
        <div style={{ fontSize: 14, color: "#000000", fontWeight: 600 }}>{value}</div>
    </div>
);