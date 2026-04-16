import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import DownloadIcon from "@mui/icons-material/Download";
import { downloadInvoice, getInvoice } from "../services/invoices";
import { calcInvoiceGross, calcInvoiceNet, calcLineNet } from "../utils/invoiceDashboard";

const DRAWER_WIDTH = 500;

const PAYMENT_METHOD_LABEL = {
    CARD: "Bankkártya",
    BANK_TRANSFER: "Átutalás",
    CASH: "Készpénz",
    CHECK: "Csekk",
    PAYPAL: "PayPal",
    SZEP_CARD: "SZÉP kártya",
    OTP_SIMPLE: "OTP SimplePay",
};

function StatusChip({ invoice }) {
    if (invoice.storno) return <Chip label="Stornó" color="error" size="small" />;
    return null;
}

function InfoRow({ label, value }) {
    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{
                py: 0.875,
                "&:not(:last-child)": { borderBottom: "1px solid", borderColor: "divider" },
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ flexShrink: 0, mr: 2, fontSize: "0.8rem" }}
            >
                {label}
            </Typography>
            <Typography
                variant="body2"
                fontWeight={500}
                sx={{ fontSize: "0.875rem", textAlign: "right", wordBreak: "break-word" }}
            >
                {value || "—"}
            </Typography>
        </Stack>
    );
}

function SectionLabel({ children }) {
    return (
        <Typography
            sx={{
                fontSize: "0.67rem",
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "text.disabled",
                mb: 1,
            }}
        >
            {children}
        </Typography>
    );
}



export default function InvoicePreview({ invoiceId, open, onClose, onOpenDetails }) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !invoiceId) {
            setInvoice(null);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);
        setInvoice(null);

        getInvoice(invoiceId)
            .then((data) => { if (!cancelled) setInvoice(data); })
            .catch((err) => { if (!cancelled) setError(err); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [open, invoiceId]);

    const netto = invoice ? calcInvoiceNet(invoice) : 0;
    const brutto = invoice ? calcInvoiceGross(invoice) : 0;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            slotProps={{
                paper: {
                    sx: {
                        width: { xs: "100vw", sm: DRAWER_WIDTH },
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "-4px 0 28px rgba(0,0,0,0.1)",
                    },
                },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    minHeight: 60,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ letterSpacing: "-0.01em" }}
                    >
                        {loading ? "Betöltés…" : invoice ? invoice.invoiceNumber : "Előnézet"}
                    </Typography>
                    {!loading && invoice && <StatusChip invoice={invoice} />}
                </Stack>

                <Tooltip title="Bezárás" placement="left">
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto" }}>
                {loading && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 220,
                        }}
                    >
                        <CircularProgress size={26} />
                    </Box>
                )}

                {!loading && error && (
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Typography variant="body2" color="error">
                            Nem sikerült betölteni a számlát.
                        </Typography>
                    </Box>
                )}

                {!loading && invoice && (
                    <>
                        {/* General info */}
                        <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
                            <SectionLabel>Általános adatok</SectionLabel>
                            <InfoRow
                                label="Partner"
                                value={
                                    invoice.partnerName ||
                                    invoice.partner?.name ||
                                    invoice.partnerData?.name
                                }
                            />
                            <InfoRow
                                label="Fizetési mód"
                                value={
                                    PAYMENT_METHOD_LABEL[invoice.paymentMethod] ??
                                    invoice.paymentMethod
                                }
                            />
                        </Box>

                        {/* Dates */}
                        <Box sx={{ px: 3, pb: 2 }}>
                            <SectionLabel>Dátumok</SectionLabel>
                            <InfoRow
                                label="Kiállítás dátuma"
                                value={
                                    invoice.date
                                        ? new Date(invoice.date).toLocaleDateString("hu-HU")
                                        : null
                                }
                            />
                            <InfoRow
                                label="Fizetési határidő"
                                value={
                                    invoice.dueDate
                                        ? new Date(invoice.dueDate).toLocaleDateString("hu-HU")
                                        : null
                                }
                            />
                            <InfoRow
                                label="Teljesítési dátum"
                                value={
                                    invoice.completionDate
                                        ? new Date(invoice.completionDate).toLocaleDateString("hu-HU")
                                        : null
                                }
                            />
                        </Box>

                        <Divider />

                        {/* Items */}
                        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                            <SectionLabel>
                                Tételek{invoice.items?.length ? ` (${invoice.items.length})` : ""}
                            </SectionLabel>
                        </Box>

                        <Box sx={{ px: 1.5, pb: 1 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "grey.50" }}>
                                        <TableCell sx={{ fontSize: "0.73rem", fontWeight: 600, py: 1, pl: 1.5 }}>
                                            Termék
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.73rem", fontWeight: 600, py: 1 }}>
                                            Menny.
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.73rem", fontWeight: 600, py: 1 }}>
                                            Egységár
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.73rem", fontWeight: 600, py: 1, pr: 1.5 }}>
                                            Nettó
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoice.items?.map((item, idx) => {
                                        const itemNetto = calcLineNet(item);
                                        return (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ py: 1, pl: 1.5, maxWidth: 150 }}>
                                                    <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                                        {item.productName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled" display="block">
                                                        ÁFA: {item.taxRate}%
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: "0.8rem", py: 1, whiteSpace: "nowrap" }}>
                                                    {item.productAmount} {item.productUnit}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: "0.8rem", py: 1, whiteSpace: "nowrap" }}>
                                                    {item.amount.toLocaleString("hu-HU")} Ft
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: "0.8rem", py: 1, pr: 1.5, whiteSpace: "nowrap" }}>
                                                    {itemNetto.toLocaleString("hu-HU")} Ft
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>

                        {/* Totals */}
                        <Box sx={{ px: 3, pt: 2, pb: 3 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={0.75}>
                                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                    <Typography variant="body2" color="text.secondary">
                                        Nettó összesen
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {netto.toLocaleString("hu-HU")} Ft
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                    <Typography variant="body2" fontWeight={700}>
                                        Bruttó összesen
                                    </Typography>
                                    <Typography variant="body1" fontWeight={700}>
                                        {brutto.toLocaleString("hu-HU")} Ft
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </>
                )}
            </Box>

            {!loading && invoice && (
                <Box
                    sx={{
                        flexShrink: 0,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        px: 3,
                        py: 2,
                        display: "flex",
                        gap: 1.5,
                    }}
                >
                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<OpenInFullIcon sx={{ fontSize: "15px !important" }} />}
                        onClick={onOpenDetails}
                        sx={{
                            flex: 1,
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 1.5,
                            fontSize: "0.875rem",
                        }}
                    >
                        Részletek megnyitása
                    </Button>
                    <Tooltip title="PDF letöltése" placement="top">
                        <Button
                            variant="outlined"
                            onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                            sx={{
                                textTransform: "none",
                                fontWeight: 500,
                                borderRadius: 1.5,
                                minWidth: "unset",
                                px: 2,
                            }}
                        >
                            <DownloadIcon sx={{ fontSize: 18 }} />
                        </Button>
                    </Tooltip>
                </Box>
            )}
        </Drawer>
    );
}
