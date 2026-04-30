import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    Divider,
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
import { calcInvoiceNet, calcLineNet } from "../utils/invoiceDashboard";

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

function MetaLabel({ children }) {
    return (
        <Typography
            sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "text.disabled",
                mb: 0.5,
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
            .catch((err)  => { if (!cancelled) setError(err);   })
            .finally(()   => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [open, invoiceId]);

    const netto  = invoice ? calcInvoiceNet(invoice)  : 0;
    const brutto = invoice ? (invoice.grossAmount ?? 0) : 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: { xs: "95vw", sm: 660 },
                    maxHeight: "88vh",
                    borderRadius: 2.5,
                    boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                },
            }}
        >
            {loading && (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
                    <CircularProgress size={26} />
                </Box>
            )}

            {!loading && error && (
                <Box sx={{ p: 4 }}>
                    <Typography variant="body2" color="error">
                        Nem sikerült betölteni a számlát.
                    </Typography>
                </Box>
            )}

            {!loading && invoice && (
                <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    <Box
                        sx={{
                            px: 4,
                            pt: 3,
                            pb: 2.5,
                            bgcolor: "grey.50",
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            flexShrink: 0,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: "0.6rem",
                                        fontWeight: 700,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        color: "text.disabled",
                                        mb: 0.5,
                                    }}
                                >
                                    Számla
                                </Typography>
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{ letterSpacing: "-0.02em", fontSize: "1.15rem", lineHeight: 1.2 }}
                                >
                                    {invoice.invoiceNumber}
                                </Typography>
                            </Box>

                            <Stack alignItems="flex-end" spacing={1}>
                                <IconButton size="small" onClick={onClose}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                                <StatusChip invoice={invoice} />
                            </Stack>
                        </Stack>
                    </Box>

                    <Box sx={{ overflowY: "auto", flex: 1 }}>

                        <Box sx={{ px: 4, py: 2.5 }}>
                            <Stack direction="row" spacing={5}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <MetaLabel>Partner</MetaLabel>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>
                                        {invoice.partnerName || invoice.partner?.name || invoice.partnerData?.name || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{ flexShrink: 0 }}>
                                    <MetaLabel>Adatok</MetaLabel>
                                    <Stack spacing={0.3}>
                                        {invoice.date && (
                                            <Stack direction="row" spacing={1} alignItems="baseline">
                                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", minWidth: 68 }}>
                                                    Kiállítás:
                                                </Typography>
                                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                                                    {new Date(invoice.date).toLocaleDateString("hu-HU")}
                                                </Typography>
                                            </Stack>
                                        )}
                                        {invoice.dueDate && (
                                            <Stack direction="row" spacing={1} alignItems="baseline">
                                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", minWidth: 68 }}>
                                                    Határidő:
                                                </Typography>
                                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                                                    {new Date(invoice.dueDate).toLocaleDateString("hu-HU")}
                                                </Typography>
                                            </Stack>
                                        )}
                                        {invoice.completionDate && (
                                            <Stack direction="row" spacing={1} alignItems="baseline">
                                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", minWidth: 68 }}>
                                                    Teljesítés:
                                                </Typography>
                                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                                                    {new Date(invoice.completionDate).toLocaleDateString("hu-HU")}
                                                </Typography>
                                            </Stack>
                                        )}
                                        {invoice.paymentMethod && (
                                            <Stack direction="row" spacing={1} alignItems="baseline">
                                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", minWidth: 68 }}>
                                                    Fizetés:
                                                </Typography>
                                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                                                    {PAYMENT_METHOD_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>

                        <Divider />

                        <Box sx={{ px: 2, py: 1 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "grey.50" }}>
                                        <TableCell sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", py: 0.875, pl: 2 }}>
                                            Termék / Szolgáltatás
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", py: 0.875 }}>
                                            Menny.
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", py: 0.875 }}>
                                            Egységár
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", py: 0.875, pr: 2 }}>
                                            Nettó
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoice.items?.map((item, idx) => {
                                        const itemNetto = calcLineNet(item);
                                        return (
                                            <TableRow key={idx} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                                                <TableCell sx={{ py: 1.25, pl: 2 }}>
                                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 500 }}>
                                                        {item.productName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled">
                                                        ÁFA: {item.taxRate}%
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: "0.82rem", py: 1.25, whiteSpace: "nowrap" }}>
                                                    {item.productAmount} {item.productUnit}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: "0.82rem", py: 1.25, whiteSpace: "nowrap" }}>
                                                    {item.amount.toLocaleString("hu-HU")} Ft
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: "0.82rem", py: 1.25, pr: 2, whiteSpace: "nowrap" }}>
                                                    {itemNetto.toLocaleString("hu-HU")} Ft
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>

                        <Box sx={{ px: 4, pt: 1.5, pb: 3 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={0.75}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">
                                        Nettó összesen
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {netto.toLocaleString("hu-HU")} Ft
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" fontWeight={700}>
                                        Bruttó összesen
                                    </Typography>
                                    <Typography variant="body1" fontWeight={700}>
                                        {brutto.toLocaleString("hu-HU")} Ft
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            flexShrink: 0,
                            borderTop: "1px solid",
                            borderColor: "divider",
                            px: 3,
                            py: 1.75,
                            display: "flex",
                            gap: 1.5,
                            bgcolor: "grey.50",
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
                                sx={{ textTransform: "none", borderRadius: 1.5, minWidth: "unset", px: 2 }}
                            >
                                <DownloadIcon sx={{ fontSize: 18 }} />
                            </Button>
                        </Tooltip>
                    </Box>
                </DialogContent>
            )}
        </Dialog>
    );
}
