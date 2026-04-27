import { useEffect, useState } from "react";
import {
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Popover,
    Slider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";
import { listInvoices } from "../services/invoices";
import { calcInvoiceGross, calcInvoiceNet } from "../utils/invoiceDashboard";
import InvoicePreview from "./InvoicePreview";

// ─── Constants ────────────────────────────────────────────────────────────────

const AMOUNT_MAX = 10_000_000;

const formatFt = (v) => `${v.toLocaleString("hu-HU")} Ft`;

// Parses PREFIX-YYYY-COUNTER → { year, counter } as numbers.
// Works regardless of prefix length or number of prefix segments.
function parseInvoiceNum(invoiceNumber) {
    const parts = (invoiceNumber || "").split("-");
    return {
        year:    parseInt(parts[parts.length - 2], 10) || 0,
        counter: parseInt(parts[parts.length - 1], 10) || 0,
    };
}

const SORT_OPTIONS = [
    { value: "date_desc",        label: "Legújabb",     sortBy: "date",        sortDir: "desc" },
    { value: "date_asc",         label: "Legrégebbi",   sortBy: "date",        sortDir: "asc"  },
    { value: "brutto_desc",      label: "Bruttó ↓",     sortBy: "brutto",      sortDir: "desc" },
    { value: "brutto_asc",       label: "Bruttó ↑",     sortBy: "brutto",      sortDir: "asc"  },
    { value: "partnerName_asc",  label: "Partner A–Z",  sortBy: "partnerName", sortDir: "asc"  },
    { value: "partnerName_desc", label: "Partner Z–A",  sortBy: "partnerName", sortDir: "desc" },
];

const PAYMENT_METHODS = [
    { value: "CARD",          label: "Bankkártya"    },
    { value: "BANK_TRANSFER", label: "Átutalás"      },
    { value: "CASH",          label: "Készpénz"      },
    { value: "CHECK",         label: "Csekk"         },
    { value: "PAYPAL",        label: "PayPal"        },
    { value: "SZEP_CARD",     label: "SZÉP kártya"   },
    { value: "OTP_SIMPLE",    label: "OTP SimplePay" },
];

const PAYMENT_METHOD_LABEL = Object.fromEntries(
    PAYMENT_METHODS.map(({ value, label }) => [value, label])
);

const EMPTY_FILTERS = {
    paymentMethod:      "",
    storno:             "",
    issueDateFrom:      "",
    issueDateTo:        "",
    dueDateFrom:        "",
    dueDateTo:          "",
    completionDateFrom: "",
    completionDateTo:   "",
};

function FilterDateField({ label, value, onChange }) {
    return (
        <TextField
            label={label}
            type="date"
            size="small"
            fullWidth
            value={value}
            onChange={onChange}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
                "& input[type='date']:not(:focus)::-webkit-datetime-edit": {
                    color: value ? undefined : "transparent",
                },
                "& .MuiInputBase-root::after": {
                    content: value ? '""' : '"év-hó-nap"',
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(0,0,0,0.38)",
                    fontSize: "0.8rem",
                    pointerEvents: "none",
                    zIndex: 1,
                },
                "& .MuiInputBase-root:focus-within::after": {
                    content: '""',
                },
            }}
        />
    );
}

function FilterSectionLabel({ children }) {
    return (
        <Typography
            sx={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "text.disabled",
                mb: 0.75,
            }}
        >
            {children}
        </Typography>
    );
}


export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [initialLoad, setInitialLoad] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortOption, setSortOption] = useState("date_desc");

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const [amountRange, setAmountRange] = useState([0, AMOUNT_MAX]);
    const amountFilterActive = amountRange[0] > 0 || amountRange[1] < AMOUNT_MAX;

    const searchLower = search.trim().toLowerCase();
    const displayedInvoices = invoices.filter((inv) => {
        if (searchLower) {
            const partnerName = (inv.partnerData?.name || "").toLowerCase();
            const invoiceNum  = (inv.invoiceNumber   || "").toLowerCase();
            if (!partnerName.includes(searchLower) && !invoiceNum.includes(searchLower)) {
                return false;
            }
        }
        if (amountFilterActive && filters.storno !== true && !inv.storno) {
            const brutto = calcInvoiceGross(inv);
            if (brutto < amountRange[0] || brutto > amountRange[1]) return false;
        }
        return true;
    });

    const pagedInvoices = displayedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const [selectedId, setSelectedId] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const filterOpen = Boolean(filterAnchorEl);

    const navigate = useNavigate();

    const activeFilterCount = [
        filters.paymentMethod,
        filters.storno !== "",
        filters.issueDateFrom,
        filters.issueDateTo,
        filters.dueDateFrom,
        filters.dueDateTo,
        filters.completionDateFrom,
        filters.completionDateTo,
        amountFilterActive,
    ].filter(Boolean).length;

    useEffect(() => {
        const { sortBy, sortDir } =
            SORT_OPTIONS.find((o) => o.value === sortOption) ?? SORT_OPTIONS[0];

        let cancelled = false;

        const isClientSort = sortBy === "date" || sortBy === "brutto" || sortBy === "partnerName";

        const load = async () => {
            try {
                setFetching(true);
                setError(null);
                const data = await listInvoices({
                    page: isClientSort ? 0 : page,
                    size: isClientSort ? 10000 : rowsPerPage,
                    sortBy: isClientSort ? "date" : sortBy,
                    sortDir: isClientSort ? "desc" : sortDir,
                    ...filters,
                });
                if (!cancelled) {
                    let content = data.content || [];
                    if (isClientSort) {
                        if (sortBy === "date") {
                            content = [...content].sort((a, b) => {
                                const dateA = a.date ? new Date(a.date).getTime() : 0;
                                const dateB = b.date ? new Date(b.date).getTime() : 0;
                                if (dateA !== dateB) return sortDir === "desc" ? dateB - dateA : dateA - dateB;
                                const { year: yA, counter: cA } = parseInvoiceNum(a.invoiceNumber);
                                const { year: yB, counter: cB } = parseInvoiceNum(b.invoiceNumber);
                                if (yA !== yB) return sortDir === "desc" ? yB - yA : yA - yB;
                                return sortDir === "desc" ? cB - cA : cA - cB;
                            });
                        } else if (sortBy === "brutto") {
                            content = [...content].sort((a, b) =>
                                sortDir === "asc" ? calcInvoiceGross(a) - calcInvoiceGross(b) : calcInvoiceGross(b) - calcInvoiceGross(a)
                            );
                        } else {
                            content = [...content].sort((a, b) => {
                                const nameA = (a.partnerData?.name || "").toLowerCase();
                                const nameB = (b.partnerData?.name || "").toLowerCase();
                                return sortDir === "asc"
                                    ? nameA.localeCompare(nameB, "hu")
                                    : nameB.localeCompare(nameA, "hu");
                            });
                        }
                    }
                    setInvoices(content);
                    setTotalElements(data.totalElements || 0);
                }
            } catch (err) {
                if (!cancelled) { console.error(err); setError(err); }
            } finally {
                if (!cancelled) { setFetching(false); setInitialLoad(false); }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [page, rowsPerPage, sortOption, filters]);

    const setFilterField = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setPage(0);
    };

    const handleClearFilters = () => {
        setSearch("");
        setFilters(EMPTY_FILTERS);
        setAmountRange([0, AMOUNT_MAX]);
        setPage(0);
    };

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    if (initialLoad) {
        return (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                <CircularProgress size={28} />
                <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: "0.875rem" }}>
                    Betöltés…
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography color="error" variant="body2">
                    Hiba történt a számlák betöltésekor.
                </Typography>
            </Paper>
        );
    }

    const rangeLabel = `${formatFt(amountRange[0])} – ${
        amountRange[1] >= AMOUNT_MAX ? "Korlátlan" : formatFt(amountRange[1])
    }`;

    return (
        <>
            <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ px: 2, py: 1.25, flexWrap: "wrap" }}
                >
                    <TextField
                        size="small"
                        placeholder="Keresés"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        autoComplete="off"
                        sx={{ flex: 1, minWidth: 180 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 17, color: "action.active" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <Badge
                        badgeContent={activeFilterCount}
                        color="primary"
                        sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", height: 15, minWidth: 15 } }}
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FilterListIcon sx={{ fontSize: "15px !important" }} />}
                            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                            sx={{
                                textTransform: "none",
                                fontSize: "0.78rem",
                                color: activeFilterCount > 0 ? "primary.main" : "text.secondary",
                                borderColor: activeFilterCount > 0 ? "primary.main" : "divider",
                                whiteSpace: "nowrap",
                                px: 1.25,
                            }}
                        >
                            Szűrők
                        </Button>
                    </Badge>

                    <TextField
                        select
                        size="small"
                        value={sortOption}
                        onChange={(e) => { setSortOption(e.target.value); setPage(0); }}
                        sx={{
                            width: 130,
                            "& .MuiInputBase-root": { height: "30px" },
                            "& .MuiSelect-select": { fontSize: "0.78rem" },
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SwapVertIcon sx={{ fontSize: 14, color: "action.active" }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    >
                        {SORT_OPTIONS.map(({ value, label }) => (
                            <MenuItem key={value} value={value} sx={{ fontSize: "0.85rem" }}>{label}</MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        size="small"
                        disableElevation
                        startIcon={<AddIcon sx={{ fontSize: "16px !important" }} />}
                        onClick={() => navigate("/invoices/new")}
                        sx={{ textTransform: "none", whiteSpace: "nowrap", px: 1.5 }}
                    >
                        Új számla
                    </Button>

                    <Typography
                        variant="body2"
                        color="text.disabled"
                        sx={{ fontSize: "0.75rem", whiteSpace: "nowrap", pl: 0.5 }}
                    >
                        {(searchLower || amountFilterActive)
                            ? `${displayedInvoices.length} / ${totalElements}`
                            : `${totalElements} db`}
                    </Typography>
                </Stack>

                <Divider />

                <TableContainer sx={{ opacity: fetching ? 0.45 : 1, transition: "opacity 0.2s" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                {[
                                    { label: "Számlaszám" },
                                    { label: "Partner" },
                                    { label: "Dátum" },
                                    { label: "Fizetési mód" },
                                    { label: "Nettó",  align: "right" },
                                    { label: "Bruttó", align: "right" },
                                    { label: "Állapot" },
                                    { label: "" },
                                ].map(({ label, align }) => (
                                    <TableCell
                                        key={label}
                                        align={align}
                                        sx={{
                                            fontWeight: 500,
                                            fontSize: "0.78rem",
                                            color: "text.secondary",
                                            letterSpacing: "0.01em",
                                            py: 1.25,
                                        }}
                                    >
                                        {label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {displayedInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <Stack alignItems="center" spacing={1.25} sx={{ py: 7 }}>
                                            <ReceiptLongIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                                            <Typography color="text.secondary" variant="body2">
                                                Nincs a szűrőknek megfelelő számla.
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedInvoices.map((inv) => {
                                    const netto = calcInvoiceNet(inv);
                                    const brutto = calcInvoiceGross(inv);
                                    const isSelected = selectedId === inv.id && previewOpen;

                                    return (
                                        <TableRow
                                            key={inv.id}
                                            hover
                                            onClick={() => navigate(`/invoices/${inv.id}`)}
                                            sx={{
                                                cursor: "pointer",
                                                bgcolor: isSelected
                                                    ? "rgba(79,70,229,0.04)"
                                                    : inv.storno
                                                    ? "rgba(211,47,47,0.04)"
                                                    : undefined,
                                                "&:hover": {
                                                    bgcolor: isSelected
                                                        ? "rgba(79,70,229,0.07) !important"
                                                        : inv.storno
                                                        ? "rgba(211,47,47,0.08) !important"
                                                        : undefined,
                                                },
                                                borderLeft: `3px solid ${isSelected ? "#818cf8" : inv.storno ? "#d32f2f" : "transparent"}`,
                                                transition: "border-color 0.15s ease, background-color 0.15s ease",
                                            }}
                                        >
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: "0.875rem" }}>
                                                    {inv.invoiceNumber}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2">
                                                    {inv.partnerData?.name || "—"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {inv.date
                                                        ? new Date(inv.date).toLocaleDateString("hu-HU")
                                                        : "—"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ py: 1.5 }}>
                                                {inv.paymentMethod ? (
                                                    <Chip
                                                        label={PAYMENT_METHOD_LABEL[inv.paymentMethod] ?? inv.paymentMethod}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: "0.72rem", height: 22 }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>

                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                                                    {netto.toLocaleString("hu-HU")} Ft
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: "0.875rem" }}>
                                                    {brutto.toLocaleString("hu-HU")} Ft
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ py: 1.5 }}>
                                                {inv.storno ? (
                                                    <Chip label="Sztornó" color="error" size="small" />
                                                ) : null}
                                            </TableCell>

                                            <TableCell sx={{ py: 1.5, pr: 1.5, width: 36 }}>
                                                <Tooltip title="Gyors előnézet" placement="left">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedId(inv.id);
                                                            setPreviewOpen(true);
                                                        }}
                                                        sx={{ color: "action.active", "&:hover": { color: "primary.main" } }}
                                                    >
                                                        <VisibilityIcon sx={{ fontSize: 17 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Divider />
                <TablePagination
                    component="div"
                    count={displayedInvoices.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[10, 20, 50]}
                    labelRowsPerPage="Sorok száma:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}–${to} / ${count !== -1 ? count : `több mint ${to}`}`
                    }
                />
            </Paper>

            <Popover
                open={filterOpen}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            width: 300,
                            maxHeight: "min(480px, 68vh)",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
                            overflow: "hidden",
                        },
                    },
                }}
            >
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                        px: 2,
                        py: 1.25,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        flexShrink: 0,
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={600}>Szűrők</Typography>
                    {activeFilterCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleClearFilters}
                            disableRipple
                            sx={{
                                textTransform: "none",
                                p: 0,
                                minWidth: "unset",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                "&:hover": { bgcolor: "transparent", color: "error.main" },
                            }}
                        >
                            Összes törlése
                        </Button>
                    )}
                </Stack>

                <Box sx={{ overflowY: "auto", p: 2 }}>
                    <Stack spacing={1.75}>

                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                <FilterSectionLabel>Bruttó összeg</FilterSectionLabel>
                                <Typography
                                    sx={{
                                        fontSize: "0.78rem",
                                        fontWeight: 600,
                                        color: amountFilterActive && filters.storno !== true ? "primary.main" : "text.secondary",
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    {rangeLabel}
                                </Typography>
                            </Stack>

                            <Box sx={{ px: 0.75 }}>
                                <Slider
                                    value={amountRange}
                                    onChange={(_, v) => { setAmountRange(v); setPage(0); }}
                                    min={0}
                                    max={AMOUNT_MAX}
                                    step={50_000}
                                    disableSwap
                                    size="small"
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(v) =>
                                        v >= AMOUNT_MAX ? "Max" : formatFt(v)
                                    }
                                    disabled={filters.storno === true}
                                />
                            </Box>

                            <Stack direction="row" spacing={1}>
                                <TextField
                                    label="Min (Ft)"
                                    size="small"
                                    fullWidth
                                    disabled={filters.storno === true}
                                    value={amountRange[0] > 0 ? amountRange[0].toLocaleString("hu-HU") : ""}
                                    placeholder="0"
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[\s\u00A0]/g, "");
                                        const v = Math.max(0, Number(raw) || 0);
                                        setAmountRange([Math.min(v, amountRange[1]), amountRange[1]]);
                                        setPage(0);
                                    }}
                                    inputProps={{ inputMode: "numeric" }}
                                />
                                <TextField
                                    label="Max (Ft)"
                                    size="small"
                                    fullWidth
                                    disabled={filters.storno === true}
                                    value={amountRange[1] < AMOUNT_MAX ? amountRange[1].toLocaleString("hu-HU") : ""}
                                    placeholder="Korlátlan"
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[\s\u00A0]/g, "");
                                        const v = raw
                                            ? Math.min(AMOUNT_MAX, Math.max(amountRange[0], Number(raw)))
                                            : AMOUNT_MAX;
                                        setAmountRange([amountRange[0], v]);
                                        setPage(0);
                                    }}
                                    inputProps={{ inputMode: "numeric" }}
                                />
                            </Stack>

                            {filters.storno === true && (
                                <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", mt: 0.75 }}>
                                    Sztornó szűrő aktív – bruttó szűrés nem alkalmazható.
                                </Typography>
                            )}
                            {filters.storno === "" && amountFilterActive && (
                                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.75 }}>
                                    A bruttó szűrő csak a normál számlákra vonatkozik.
                                </Typography>
                            )}
                        </Box>

                        <Divider />

                        <Box>
                            <TextField
                                select
                                size="small"
                                fullWidth
                                value={filters.paymentMethod}
                                onChange={(e) => setFilterField("paymentMethod", e.target.value)}
                                slotProps={{
                                    select: {
                                        displayEmpty: true,
                                        renderValue: (v) =>
                                            v ? (PAYMENT_METHOD_LABEL[v] ?? v) : (
                                                <span style={{ color: "rgba(0,0,0,0.38)" }}>Fizetési mód</span>
                                            ),
                                    },
                                }}
                            >
                                <MenuItem value="">Minden fizetési mód</MenuItem>
                                {PAYMENT_METHODS.map(({ value, label }) => (
                                    <MenuItem key={value} value={value} sx={{ fontSize: "0.875rem" }}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Divider />

                        <Box>
                            <FilterSectionLabel>Állapot</FilterSectionLabel>
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    label="Sztornó"
                                    clickable
                                    color={filters.storno === true ? "error" : "default"}
                                    variant={filters.storno === true ? "filled" : "outlined"}
                                    onClick={() => setFilterField("storno", filters.storno === true ? "" : true)}
                                    size="small"
                                />
                                <Chip
                                    label="Normál"
                                    clickable
                                    color={filters.storno === false ? "success" : "default"}
                                    variant={filters.storno === false ? "filled" : "outlined"}
                                    onClick={() => setFilterField("storno", filters.storno === false ? "" : false)}
                                    size="small"
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        {/* ── 4. Kiállítás dátuma ── */}
                        <Box>
                            <FilterSectionLabel>Kiállítás dátuma</FilterSectionLabel>
                            <Stack direction="row" spacing={1}>
                                <FilterDateField label="Tól" value={filters.issueDateFrom} onChange={(e) => setFilterField("issueDateFrom", e.target.value)} />
                                <FilterDateField label="Ig"  value={filters.issueDateTo}   onChange={(e) => setFilterField("issueDateTo",   e.target.value)} />
                            </Stack>
                        </Box>

                        <Box>
                            <FilterSectionLabel>Fizetési határidő</FilterSectionLabel>
                            <Stack direction="row" spacing={1}>
                                <FilterDateField label="Tól" value={filters.dueDateFrom} onChange={(e) => setFilterField("dueDateFrom", e.target.value)} />
                                <FilterDateField label="Ig"  value={filters.dueDateTo}   onChange={(e) => setFilterField("dueDateTo",   e.target.value)} />
                            </Stack>
                        </Box>

                        <Box>
                            <FilterSectionLabel>Teljesítés dátuma</FilterSectionLabel>
                            <Stack direction="row" spacing={1}>
                                <FilterDateField label="Tól" value={filters.completionDateFrom} onChange={(e) => setFilterField("completionDateFrom", e.target.value)} />
                                <FilterDateField label="Ig"  value={filters.completionDateTo}   onChange={(e) => setFilterField("completionDateTo",   e.target.value)} />
                            </Stack>
                        </Box>

                    </Stack>
                </Box>
            </Popover>

            <InvoicePreview
                invoiceId={selectedId}
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                onOpenDetails={() => { if (selectedId) navigate(`/invoices/${selectedId}`); }}
            />
        </>
    );
}
