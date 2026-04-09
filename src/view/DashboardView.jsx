import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import { listInvoices } from "../services/invoices";
import {
    calcMonthlyGross,
    calcMonthlyCount,
    calcMonthlyAverage,
    getNearDueInvoices,
    calcTopPartners,
    calcPaymentMethodDist,
    calcStornoStats,
    getEarliestMonth,
} from "../utils/invoiceDashboard";

const now = new Date();

const PAYMENT_METHOD_LABEL = {
    CARD: "Bankkártya",
    BANK_TRANSFER: "Átutalás",
    CASH: "Készpénz",
    CHECK: "Csekk",
    PAYPAL: "PayPal",
    SZEP_CARD: "SZÉP kártya",
    OTP_SIMPLE: "OTP SimplePay",
};

const formatFt = (v) => `${Math.round(v).toLocaleString("hu-HU")} Ft`;

function formatDueLabel(dateStr) {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / 86_400_000);
    if (diff === 0) return "Ma";
    if (diff === 1) return "Holnap";
    const raw = due.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function dueBadgeStyle(dateStr) {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / 86_400_000);
    if (diff === 0) return { color: "#dc2626" };
    if (diff === 1) return { color: "#ef4444" };
    return { color: "#64748b" };
}

function monthLabel(year, month) {
    const d = new Date(year, month, 1);
    const raw = d.toLocaleDateString("hu-HU", { month: "long" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)";
const CARD_RADIUS = 2.5;
const GAP = 3;

function PanelHeader({ children }) {
    return (
        <>
            <Box sx={{ px: 2.5, py: 1.5, backgroundColor: "rgba(0,0,0,0.022)" }}>
                <Typography
                    sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "text.disabled",
                    }}
                >
                    {children}
                </Typography>
            </Box>
            <Divider />
        </>
    );
}

function StatCard({ label, value, sub, accentColor }) {
    return (
        <Paper
            elevation={0}
            sx={{
                py: 3.5,
                px: 3,
                height: "100%",
                borderRadius: CARD_RADIUS,
                border: "1px solid",
                borderColor: "divider",
                borderTop: `3px solid ${accentColor}`,
                boxShadow: CARD_SHADOW,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 0.75,
            }}
        >
            <Typography
                sx={{
                    fontSize: "0.67rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                }}
            >
                {label}
            </Typography>
            <Typography
                fontWeight={800}
                sx={{
                    fontSize: "1.6rem",
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                    color: "text.primary",
                }}
            >
                {value}
            </Typography>
            {sub && (
                <Typography variant="caption" sx={{ color: "text.disabled", lineHeight: 1.4 }}>
                    {sub}
                </Typography>
            )}
        </Paper>
    );
}

function DueBadge({ dateStr }) {
    const style = dueBadgeStyle(dateStr);
    return (
        <Typography
            sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: style.color,
                flexShrink: 0,
                whiteSpace: "nowrap",
                lineHeight: 1,
            }}
        >
            {formatDueLabel(dateStr)}
        </Typography>
    );
}

function SectionPanel({ children, sx }) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: CARD_RADIUS,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: CARD_SHADOW,
                overflow: "hidden",
                ...sx,
            }}
        >
            {children}
        </Paper>
    );
}

export default function DashboardView() {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selYear, setSelYear] = useState(now.getFullYear());
    const [selMonth, setSelMonth] = useState(now.getMonth());

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await listInvoices({ size: 10000, sortBy: "date", sortDir: "desc" });
                if (!cancelled) setInvoices(data.content || []);
            } catch (err) {
                if (!cancelled) { console.error(err); setError(err); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Nem sikerült betölteni az adatokat.</Alert>
            </Container>
        );
    }

    const earliest = getEarliestMonth(invoices);

    const canGoPrev = earliest && (
        selYear > earliest.year ||
        (selYear === earliest.year && selMonth > earliest.month)
    );
    const canGoNext =
        selYear < now.getFullYear() ||
        (selYear === now.getFullYear() && selMonth < now.getMonth());

    const handlePrev = () => {
        if (selMonth === 0) { setSelMonth(11); setSelYear((y) => y - 1); }
        else setSelMonth((m) => m - 1);
    };
    const handleNext = () => {
        if (selMonth === 11) { setSelMonth(0); setSelYear((y) => y + 1); }
        else setSelMonth((m) => m + 1);
    };

    const monthlyGross = calcMonthlyGross(invoices, selYear, selMonth);
    const monthlyCount = calcMonthlyCount(invoices, selYear, selMonth);
    const monthlyAvg   = calcMonthlyAverage(invoices, selYear, selMonth);
    const nearDue      = getNearDueInvoices(invoices);
    const topPartners  = calcTopPartners(invoices, selYear, selMonth);
    const paymentDist  = calcPaymentMethodDist(invoices, selYear, selMonth);
    const storno       = calcStornoStats(invoices, selYear, selMonth);

    const partnerIdByName = {};
    invoices.forEach((inv) => {
        const name = inv.partnerData?.name;
        if (name && !partnerIdByName[name]) {
            partnerIdByName[name] = inv.partnerId ?? inv.partner?.id ?? null;
        }
    });

    return (
        <Container sx={{ mt: 4, mb: 8 }}>

            {/* Month header — above both columns, belongs to neither */}
            <Box sx={{ mb: 4, pl: 2, borderLeft: "3px solid #94a3b8" }}>
                <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mb: 0.5 }}>
                    <IconButton
                        onClick={handlePrev}
                        disabled={!canGoPrev}
                        sx={{ p: 0.5, ml: -0.75, color: "text.secondary" }}
                    >
                        <ChevronLeftIcon sx={{ fontSize: "1.75rem" }} />
                    </IconButton>
                    <Typography
                        sx={{
                            fontSize: "2rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            lineHeight: 1,
                            color: "text.primary",
                            userSelect: "none",
                        }}
                    >
                        {monthLabel(selYear, selMonth)}
                    </Typography>
                    <IconButton
                        onClick={handleNext}
                        disabled={!canGoNext}
                        sx={{ p: 0.5, color: "text.secondary" }}
                    >
                        <ChevronRightIcon sx={{ fontSize: "1.75rem" }} />
                    </IconButton>
                </Stack>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 400, color: "text.secondary" }}>
                    {selYear} · Havi összesítő
                </Typography>
            </Box>

            {/* Two-column content area */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: { xs: GAP, md: 5 },
                    alignItems: "flex-start",
                }}
            >

                {/* Left — monthly statistics */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                            gap: GAP,
                            mb: GAP,
                        }}
                    >
                        <StatCard
                            label="Bruttó bevétel"
                            value={formatFt(monthlyGross)}
                            sub="Nem stornó számlák összege"
                            accentColor="#3b82f6"
                        />
                        <StatCard
                            label="Kiállított számlák"
                            value={`${monthlyCount} db`}
                            sub={`Összesen ${monthlyCount} számla ebben a hónapban`}
                            accentColor="#10b981"
                        />
                        <StatCard
                            label="Átlagos számlaérték"
                            value={monthlyCount > 0 ? formatFt(monthlyAvg) : "—"}
                            sub="Bruttó átlag"
                            accentColor="#8b5cf6"
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                            gap: GAP,
                            alignItems: "start",
                        }}
                    >
                        <SectionPanel>
                            <PanelHeader>Top partnerek</PanelHeader>
                            {topPartners.length === 0 ? (
                                <Box sx={{ px: 2.5, py: 2.5 }}>
                                    <Typography variant="body2" color="text.disabled">
                                        Nincs adat az aktuális hónapra.
                                    </Typography>
                                </Box>
                            ) : (
                                topPartners.map((partner, idx) => {
                                    const partnerId = partnerIdByName[partner.name];
                                    const isClickable = Boolean(partnerId);
                                    return (
                                        <Box key={partner.name}>
                                            <Box
                                                onClick={isClickable ? () => navigate(`/partners/${partnerId}`) : undefined}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    px: 2.5,
                                                    py: 1.75,
                                                    cursor: isClickable ? "pointer" : "default",
                                                    transition: "background-color 0.15s ease",
                                                    ...(isClickable && {
                                                        "&:hover": { backgroundColor: "action.hover" },
                                                    }),
                                                }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, minWidth: 0 }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: "0.72rem",
                                                            fontWeight: 700,
                                                            color: "text.disabled",
                                                            width: 16,
                                                            flexShrink: 0,
                                                            userSelect: "none",
                                                        }}
                                                    >
                                                        {idx + 1}.
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={500}
                                                        sx={{
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            color: isClickable ? "primary.main" : "text.primary",
                                                        }}
                                                    >
                                                        {partner.name}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    sx={{ flexShrink: 0, ml: 1.5, color: "text.primary" }}
                                                >
                                                    {formatFt(partner.gross)}
                                                </Typography>
                                            </Box>
                                            {idx < topPartners.length - 1 && <Divider />}
                                        </Box>
                                    );
                                })
                            )}
                        </SectionPanel>

                        <SectionPanel>
                            <PanelHeader>Fizetési módok</PanelHeader>
                            {paymentDist.length === 0 ? (
                                <Box sx={{ px: 2.5, py: 2.5 }}>
                                    <Typography variant="body2" color="text.disabled">
                                        Nincs adat az aktuális hónapra.
                                    </Typography>
                                </Box>
                            ) : (
                                paymentDist.map((item, idx) => (
                                    <Box key={item.method}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                px: 2.5,
                                                py: 1.75,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    mr: 1.5,
                                                    color: "text.primary",
                                                }}
                                            >
                                                {PAYMENT_METHOD_LABEL[item.method] || item.method}
                                            </Typography>
                                            <Typography
                                                fontWeight={700}
                                                sx={{ flexShrink: 0, color: "text.primary", fontSize: "1rem" }}
                                            >
                                                {item.count}
                                            </Typography>
                                        </Box>
                                        {idx < paymentDist.length - 1 && <Divider />}
                                    </Box>
                                ))
                            )}
                        </SectionPanel>

                        <SectionPanel>
                            <PanelHeader>Stornó számlák</PanelHeader>
                            <Box sx={{ px: 2.5, py: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.75 }}>
                                    <WarningAmberIcon
                                        sx={{
                                            fontSize: 14,
                                            flexShrink: 0,
                                            color: storno.count > 0 ? "#ef4444" : "text.disabled",
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                        {storno.count} db stornó számla
                                    </Typography>
                                </Stack>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 700,
                                        letterSpacing: "0.07em",
                                        textTransform: "uppercase",
                                        color: "text.disabled",
                                        display: "block",
                                        mb: 0.4,
                                    }}
                                >
                                    Bruttó összeg
                                </Typography>
                                <Typography
                                    fontWeight={700}
                                    sx={{ fontSize: "1.15rem", color: "text.primary", lineHeight: 1.2 }}
                                >
                                    {storno.count > 0 ? formatFt(storno.gross) : "—"}
                                </Typography>
                            </Box>
                        </SectionPanel>
                    </Box>
                </Box>

                {/* Right — due invoices aside */}
                <Box
                    sx={{
                        width: { xs: "100%", md: 300 },
                        flexShrink: 0,
                        position: { md: "sticky" },
                        top: { md: 24 },
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: CARD_RADIUS,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: CARD_SHADOW,
                            overflow: "hidden",
                            backgroundColor: "#f8fafc",
                        }}
                    >
                        <PanelHeader>Esedékes számlák</PanelHeader>

                        <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                <Typography
                                    fontWeight={800}
                                    sx={{
                                        fontSize: "1.6rem",
                                        lineHeight: 1,
                                        letterSpacing: "-0.03em",
                                        color: nearDue.length > 0 ? "#dc2626" : "text.disabled",
                                    }}
                                >
                                    {nearDue.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    számlán belül 3 nap
                                </Typography>
                            </Box>
                        </Box>

                        <Divider />

                        <Box sx={{ overflowY: "auto", maxHeight: 420 }}>
                            {nearDue.length === 0 ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: 120,
                                        gap: 1,
                                        px: 2.5,
                                        py: 3,
                                    }}
                                >
                                    <CheckCircleOutlineIcon sx={{ fontSize: 26, color: "text.disabled" }} />
                                    <Typography variant="body2" color="text.disabled" textAlign="center">
                                        Nincs közelgő lejáratú számla
                                    </Typography>
                                </Box>
                            ) : (
                                nearDue.map((inv, idx) => (
                                    <Box key={inv.id}>
                                        <Box
                                            onClick={() => navigate(`/invoices/${inv.id}`)}
                                            sx={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                px: 2.5,
                                                py: 1.75,
                                                cursor: "pointer",
                                                transition: "background-color 0.15s ease",
                                                "&:hover": { backgroundColor: "action.hover" },
                                            }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    sx={{
                                                        color: "text.primary",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        mb: 0.3,
                                                    }}
                                                >
                                                    {inv.invoiceNumber || `#${inv.id}`}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: "text.secondary",
                                                        display: "block",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {inv.partnerData?.name || "—"}
                                                </Typography>
                                            </Box>
                                            <DueBadge dateStr={inv.dueDate} />
                                        </Box>
                                        {idx < nearDue.length - 1 && <Divider />}
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Box>
                </Box>

            </Box>
        </Container>
    );
}
