import { useEffect, useState } from "react";
import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    Stack,
    Tooltip,
    Box,
    TextField,
    InputAdornment,
    Chip,
    Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { useNavigate } from "react-router-dom";
import { listPartners, deletePartner } from "../services/partners";

const TYPE_OPTIONS = [
    { value: "all",     label: "Összes"      },
    { value: "company", label: "Céges"       },
    { value: "person",  label: "Magánszemély" },
];

export default function PartnerList() {
    const navigate = useNavigate();
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await listPartners();
            setPartners(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err);
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deletePartner(confirmId);
            await loadData();
        } catch (err) {
            console.error("Törlés hiba:", err);
        } finally {
            setConfirmId(null);
        }
    };

    const filteredPartners = partners.filter((p) => {
        const d = p.partnerData ?? {};
        const term = search.trim().toLowerCase();
        if (term) {
            const haystack = [d.name, d.email, d.city, d.tin].filter(Boolean).join(" ").toLowerCase();
            if (!haystack.includes(term)) return false;
        }
        if (typeFilter === "company" && !d.isCompany) return false;
        if (typeFilter === "person"  &&  d.isCompany) return false;
        return true;
    });

    if (loading) {
        return (
            <Box sx={{ px: 2.5, py: 3 }}>
                <Typography variant="body2" color="text.secondary">Betöltés…</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ px: 2.5, py: 3 }}>
                <Typography variant="body2" color="error">Hiba történt a betöltés során.</Typography>
            </Box>
        );
    }

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                flexWrap="wrap"
                spacing={1}
                sx={{ px: 2.5, py: 1.25 }}
            >
                <TextField
                    size="small"
                    placeholder="Keresés"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoComplete="off"
                    sx={{ flex: 1, minWidth: 160 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 18, color: "action.active" }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <Stack direction="row" spacing={0.75} flexShrink={0}>
                    {TYPE_OPTIONS.map(({ value, label }) => (
                        <Chip
                            key={value}
                            label={label}
                            size="small"
                            clickable
                            variant={typeFilter === value ? "filled" : "outlined"}
                            color={typeFilter === value ? "primary" : "default"}
                            onClick={() => setTypeFilter(value)}
                        />
                    ))}
                </Stack>

                <Button
                    variant="contained"
                    size="small"
                    disableElevation
                    startIcon={<AddIcon sx={{ fontSize: "16px !important" }} />}
                    onClick={() => navigate("/partners/new")}
                    sx={{ textTransform: "none", whiteSpace: "nowrap", px: 1.5 }}
                >
                    Új partner
                </Button>

                <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ fontSize: "0.75rem", whiteSpace: "nowrap", alignSelf: "center" }}
                >
                    {filteredPartners.length} partner
                </Typography>
            </Stack>

            <Divider />

            <Table>
                <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: 500, fontSize: "0.78rem", color: "text.secondary" }}>
                            Név
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: "0.78rem", color: "text.secondary" }}>
                            Típus / Adószám
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: "0.78rem", color: "text.secondary" }}>
                            Cím
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: "0.78rem", color: "text.secondary" }}>
                            Email
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 500, fontSize: "0.78rem", color: "text.secondary" }}>
                            Művelet
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredPartners.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                <Stack alignItems="center" spacing={1}>
                                    <PeopleOutlineIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                                    <Typography variant="body2" color="text.disabled">
                                        {search || typeFilter !== "all"
                                            ? "Nincs a szűrőknek megfelelő partner."
                                            : "Nincs rögzített partner."}
                                    </Typography>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredPartners.map((p) => {
                            const d = p.partnerData ?? {};
                            const isCompany = Boolean(d.isCompany);

                            return (
                                <TableRow
                                    key={p.id}
                                    onClick={() => navigate(`/partners/${p.id}`)}
                                    sx={{
                                        cursor: "pointer",
                                        transition: "background-color 0.15s ease",
                                        "&:hover": { backgroundColor: "action.hover" },
                                    }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" color="text.primary">
                                            {d.name}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {isCompany ? (
                                                <>
                                                    <Tooltip title="Céges partner">
                                                        <BusinessIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                                    </Tooltip>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {d.tin && d.tin.trim() ? d.tin : "—"}
                                                    </Typography>
                                                </>
                                            ) : (
                                                <>
                                                    <Tooltip title="Magánszemély partner">
                                                        <PersonIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                                    </Tooltip>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Magánszemély
                                                    </Typography>
                                                </>
                                            )}
                                        </Stack>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {[d.zipCode, d.city, d.street, d.country].filter(Boolean).join(", ") || "—"}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {d.email || "—"}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/partners/${p.id}/edit`); }}
                                                color="primary"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); setConfirmId(p.id); }}
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <Dialog open={Boolean(confirmId)} onClose={() => setConfirmId(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Törlés megerősítése</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Biztosan törölni szeretné ezt a partnert? A művelet nem vonható vissza.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setConfirmId(null)} sx={{ textTransform: "none" }}>
                        Mégse
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        disableElevation
                        onClick={handleDeleteConfirm}
                        sx={{ textTransform: "none" }}
                    >
                        Törlés
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
