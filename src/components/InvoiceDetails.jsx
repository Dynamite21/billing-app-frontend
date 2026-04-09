import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import { useParams, useNavigate } from "react-router-dom";
import {
    createInvoice,
    downloadInvoice,
    getInvoice,
    markInvoiceAsStorno,
} from "../services/invoices";
import { calcInvoiceGross, calcInvoiceNet, calcLineGross, calcLineNet } from "../utils/invoiceDashboard";

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
    if (invoice.paid) return <Chip label="Fizetve" color="success" size="small" />;
    return <Chip label="Nyitott" size="small" variant="outlined" />;
}

/** Two-line info item used in the general info section. */
function InfoItem({ label, value }) {
    return (
        <Box>
            <Typography
                variant="caption"
                sx={{
                    display: "block",
                    color: "text.secondary",
                    fontWeight: 500,
                    mb: 0.3,
                    fontSize: "0.72rem",
                    letterSpacing: "0.01em",
                }}
            >
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={500} sx={{ fontSize: "0.9rem" }}>
                {value || "—"}
            </Typography>
        </Box>
    );
}

/** Uppercase section label, consistent with UserProfile. */
function SectionLabel({ children }) {
    return (
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
            <Typography
                sx={{
                    fontSize: "0.67rem",
                    fontWeight: 700,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    color: "text.disabled",
                }}
            >
                {children}
            </Typography>
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function InvoiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [stornoSuccess, setStornoSuccess] = useState(false);
    const [stornoError, setStornoError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getInvoice(id)
            .then((data) => { if (!cancelled) { setInvoice(data); setLoading(false); } })
            .catch((err) => { if (!cancelled) { setError(err); setLoading(false); } });

        return () => { cancelled = true; };
    }, [id]);

    const handleStorno = async () => {
        if (!invoice) return;
        setStornoError(null);

        try {
            const stornoInvoice = {
                date: new Date().toISOString().slice(0, 10),
                completionDate: invoice.completionDate,
                partnerId: invoice.partnerId,
                partnerData: invoice.partnerData || invoice.partner,
                paymentMethod: invoice.paymentMethod,
                storno: true,
                items: invoice.items.map((i) => ({
                    productName: i.productName,
                    productAmount: i.productAmount,
                    productUnit: i.productUnit,
                    amount: -Math.abs(i.amount),
                    taxRate: i.taxRate,
                })),
            };

            await createInvoice(stornoInvoice);
            await markInvoiceAsStorno(invoice.id);

            setInvoice({ ...invoice, storno: true });
            setConfirmOpen(false);
            setStornoSuccess(true);
        } catch (err) {
            console.error("Stornó hiba:", err);
            setConfirmOpen(false);
            setStornoError("Hiba történt a stornó során. Kérjük, próbálja újra.");
        }
    };

    if (loading) {
        return (
            <Typography color="text.secondary" sx={{ mt: 6, textAlign: "center" }}>
                Betöltés…
            </Typography>
        );
    }

    if (error || !invoice) {
        return (
            <Box sx={{ maxWidth: 860, mx: "auto", mt: 4, px: { xs: 2, sm: 3 } }}>
                <Alert severity="error">A számla nem található vagy hiba történt a betöltés során.</Alert>
            </Box>
        );
    }

    const nettoTotal = calcInvoiceNet(invoice);
    const bruttoTotal = calcInvoiceGross(invoice);

    return (
        <Box sx={{ maxWidth: 860, mx: "auto", mt: 4, mb: 8, px: { xs: 2, sm: 3 } }}>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "flex-start" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                {/* Left: back + invoice identity */}
                <Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                        size="small"
                        sx={{
                            textTransform: "none",
                            fontWeight: 500,
                            color: "text.secondary",
                            mb: 0.75,
                            px: 0,
                            "&:hover": { backgroundColor: "transparent", color: "text.primary" },
                        }}
                        disableRipple
                    >
                        Vissza
                    </Button>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            sx={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
                        >
                            {invoice.invoiceNumber}
                        </Typography>
                        <StatusChip invoice={invoice} />
                    </Stack>
                </Box>

                {/* Right: actions */}
                <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        disabled={invoice.storno}
                        onClick={() => setConfirmOpen(true)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 500,
                            borderRadius: 1.5,
                        }}
                    >
                        Stornó
                    </Button>
                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 1.5,
                        }}
                    >
                        PDF letöltése
                    </Button>
                </Stack>
            </Stack>

            {invoice.storno && !stornoSuccess && (
                <Alert severity="warning" sx={{ mb: 2.5 }}>
                    Ez a számla stornózott. Újabb stornó művelet nem végezhető el.
                </Alert>
            )}
            {stornoSuccess && (
                <Alert severity="success" sx={{ mb: 2.5 }}>
                    A stornó számla sikeresen létrehozva.
                </Alert>
            )}
            {stornoError && (
                <Alert severity="error" sx={{ mb: 2.5 }}>
                    {stornoError}
                </Alert>
            )}

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>

                <SectionLabel>Általános adatok</SectionLabel>

                <Box sx={{ px: 3, pb: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={2.5}>
                                <InfoItem
                                    label="Partner"
                                    value={
                                        invoice.partnerName ||
                                        invoice.partnerData?.name ||
                                        invoice.partner?.name
                                    }
                                />
                                <InfoItem
                                    label="Fizetési mód"
                                    value={
                                        PAYMENT_METHOD_LABEL[invoice.paymentMethod] ??
                                        invoice.paymentMethod
                                    }
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={2.5}>
                                <InfoItem
                                    label="Kiállítás dátuma"
                                    value={
                                        invoice.date
                                            ? new Date(invoice.date).toLocaleDateString("hu-HU")
                                            : null
                                    }
                                />
                                <InfoItem
                                    label="Fizetési határidő"
                                    value={
                                        invoice.dueDate
                                            ? new Date(invoice.dueDate).toLocaleDateString("hu-HU")
                                            : null
                                    }
                                />
                                <InfoItem
                                    label="Teljesítési dátum"
                                    value={
                                        invoice.completionDate
                                            ? new Date(invoice.completionDate).toLocaleDateString("hu-HU")
                                            : null
                                    }
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <Divider />

                <SectionLabel>Tételek</SectionLabel>

                <Box sx={{ px: 3, pb: 3, overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 560 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                    Termék
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                    Mennyiség
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                    Egység
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                    Egységár (nettó)
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                    Nettó összeg
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                    ÁFA (%)
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                    Bruttó összeg
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoice.items?.map((item, idx) => {
                                const netto = calcLineNet(item);
                                const brutto = calcLineGross(item);
                                return (
                                    <TableRow key={idx}>
                                        <TableCell sx={{ fontSize: "0.875rem" }}>
                                            {item.productName}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.875rem" }}>
                                            {item.productAmount}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.875rem" }}>
                                            {item.productUnit}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.875rem" }}>
                                            {item.amount.toLocaleString("hu-HU")} Ft
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.875rem" }}>
                                            {netto.toLocaleString("hu-HU")} Ft
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.875rem" }}>
                                            {item.taxRate}%
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                            {brutto.toLocaleString("hu-HU")} Ft
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>

                <Divider />

                {/* Totals */}
                <Box sx={{ px: 3, py: 2.5 }}>
                    <Stack alignItems="flex-end" spacing={0.75}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            sx={{ width: { xs: "100%", sm: 320 } }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Nettó összesen
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                                {nettoTotal.toLocaleString("hu-HU")} Ft
                            </Typography>
                        </Stack>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            sx={{ width: { xs: "100%", sm: 320 } }}
                        >
                            <Typography variant="body2" fontWeight={700}>
                                Bruttó összesen
                            </Typography>
                            <Typography variant="body1" fontWeight={700}>
                                {bruttoTotal.toLocaleString("hu-HU")} Ft
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    Stornózás megerősítése
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Biztosan stornózni szeretné a{" "}
                        <strong>{invoice.invoiceNumber}</strong> számú számlát?
                        Ez a művelet visszavonhatatlan és egy új stornó számlát hoz létre.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        onClick={() => setConfirmOpen(false)}
                        sx={{ textTransform: "none", fontWeight: 500 }}
                    >
                        Mégse
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        disableElevation
                        onClick={handleStorno}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                    >
                        Igen, stornózom
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
