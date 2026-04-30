import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import { getPartner, deletePartner } from "../services/partners";

const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)";
const CARD_RADIUS = 2;

function DetailRow({ icon, label, value }) {
    if (!value) return null;
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
            }}
        >
            <Box sx={{ color: "text.disabled", flexShrink: 0, display: "flex" }}>
                {icon}
            </Box>
            <Typography
                sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "text.disabled",
                    width: 72,
                    flexShrink: 0,
                }}
            >
                {label}
            </Typography>
            <Typography variant="body2" color="text.primary">
                {value}
            </Typography>
        </Box>
    );
}

export default function PartnerDetailsView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getPartner(id)
            .then((data) => { if (!cancelled) { setPartner(data); setLoading(false); } })
            .catch((err) => { if (!cancelled) { setError(err); setLoading(false); } });
        return () => { cancelled = true; };
    }, [id]);

    const handleDeleteConfirm = async () => {
        try {
            await deletePartner(id);
            navigate("/partners");
        } catch (err) {
            console.error("Törlés hiba:", err);
        } finally {
            setConfirmOpen(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Alert severity="error">Nem sikerült betölteni a partner adatait.</Alert>
            </Container>
        );
    }

    const d = partner?.partnerData ?? {};
    const isCompany = Boolean(d.isCompany);

    const addressParts = [d.zipCode, d.city, d.street, d.country].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : null;

    return (
        <Container maxWidth="sm" sx={{ mt: 3, mb: 6 }}>

            <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/partners")}
                disableRipple
                sx={{
                    px: 0,
                    mb: 1.5,
                    color: "text.secondary",
                    textTransform: "none",
                    "&:hover": { background: "transparent", color: "text.primary" },
                }}
            >
                Vissza
            </Button>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: CARD_RADIUS,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: CARD_SHADOW,
                    px: 2.5,
                    py: 2,
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1.5,
                }}
            >
                <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={600} lineHeight={1.2}>
                        {d.name || "—"}
                    </Typography>
                    <Chip
                        size="small"
                        icon={isCompany
                            ? <BusinessIcon sx={{ fontSize: "0.85rem !important" }} />
                            : <PersonIcon sx={{ fontSize: "0.85rem !important" }} />
                        }
                        label={isCompany ? "Céges partner" : "Magánszemély"}
                        variant="outlined"
                        sx={{ fontSize: "0.72rem", alignSelf: "flex-start" }}
                    />
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        disableElevation
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/partners/${id}/edit`)}
                        sx={{ textTransform: "none", borderRadius: 1.5 }}
                    >
                        Szerkesztés
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setConfirmOpen(true)}
                        sx={{ textTransform: "none", borderRadius: 1.5 }}
                    >
                        Törlés
                    </Button>
                </Stack>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: CARD_RADIUS,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: CARD_SHADOW,
                    overflow: "hidden",
                }}
            >
                <Box sx={{ px: 2, py: 1.25, backgroundColor: "rgba(0,0,0,0.022)" }}>
                    <Typography
                        sx={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "text.disabled",
                        }}
                    >
                        Partner adatok
                    </Typography>
                </Box>
                <Divider />

                <DetailRow
                    icon={<BadgeIcon fontSize="small" />}
                    label="Név"
                    value={d.name}
                />

                {isCompany && d.tin && (
                    <>
                        <Divider />
                        <DetailRow
                            icon={<BusinessIcon fontSize="small" />}
                            label="Adószám"
                            value={d.tin}
                        />
                    </>
                )}

                {address && (
                    <>
                        <Divider />
                        <DetailRow
                            icon={<LocationOnIcon fontSize="small" />}
                            label="Cím"
                            value={address}
                        />
                    </>
                )}

                {d.email && (
                    <>
                        <Divider />
                        <DetailRow
                            icon={<EmailIcon fontSize="small" />}
                            label="Email"
                            value={d.email}
                        />
                    </>
                )}
            </Paper>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Törlés megerősítése</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Biztosan törölni szeretné ezt a partnert? A művelet nem vonható vissza.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: "none" }}>
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
        </Container>
    );
}
