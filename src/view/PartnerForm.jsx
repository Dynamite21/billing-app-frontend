import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Divider,
    FormControlLabel,
    Grid,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { getPartner, savePartner, updatePartner } from "../services/partners";

const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)";
const CARD_RADIUS = 2;

function SectionLabel({ children }) {
    return (
        <Typography
            variant="overline"
            sx={{
                display: "block",
                color: "text.secondary",
                fontWeight: 700,
                letterSpacing: 1.2,
                mb: 1,
            }}
        >
            {children}
        </Typography>
    );
}

export default function PartnerFormView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        id: null,
        name: "",
        isCompany: false,
        tin: "",
        country: "",
        zipCode: "",
        city: "",
        street: "",
        email: "",
    });

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        let cancelled = false;
        getPartner(id)
            .then((data) => {
                if (cancelled) return;
                const d = data.partnerData ?? {};
                setForm({
                    id: data.id,
                    name: d.name || "",
                    isCompany: Boolean(d.isCompany),
                    tin: d.tin || "",
                    country: d.country || "",
                    zipCode: d.zipCode || "",
                    city: d.city || "",
                    street: d.street || "",
                    email: d.email || "",
                });
                setLoading(false);
            })
            .catch((err) => {
                if (!cancelled) { setLoadError(err); setLoading(false); }
            });
        return () => { cancelled = true; };
    }, [id, isEdit]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleToggleCompany = (e) => {
        setForm((prev) => ({ ...prev, isCompany: e.target.checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                partnerData: {
                    name: form.name,
                    isCompany: form.isCompany,
                    tin: form.isCompany ? form.tin : null,
                    country: form.country,
                    zipCode: form.zipCode,
                    city: form.city,
                    street: form.street,
                    email: form.email,
                },
            };
            if (isEdit) {
                await updatePartner(id, payload);
            } else {
                await savePartner(payload);
            }
            navigate("/partners");
        } catch (err) {
            console.error("Mentési hiba:", err);
            setSaving(false);
        }
    };

    const tinError = form.isCompany && !form.tin?.trim();

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (loadError) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Nem sikerült betölteni a partner adatait.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>

            {/* Header */}
            <Stack spacing={0.25} sx={{ mb: 2.5 }}>
                <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(isEdit ? `/partners/${id}` : "/partners")}
                    disableRipple
                    sx={{
                        px: 0,
                        alignSelf: "flex-start",
                        color: "text.secondary",
                        textTransform: "none",
                        "&:hover": { background: "transparent", color: "text.primary" },
                    }}
                >
                    Vissza
                </Button>
                <Typography variant="h6" fontWeight={600}>
                    {isEdit ? "Partner szerkesztése" : "Új partner"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {isEdit ? "Meglévő partner adatainak módosítása" : "Új partner felvétele az adatbázisba"}
                </Typography>
            </Stack>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="flex-start">

                    {/* Left column — identity */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: CARD_RADIUS,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: CARD_SHADOW,
                                p: 2,
                            }}
                        >
                            <SectionLabel>Azonosítás</SectionLabel>
                            <Stack spacing={1.5}>
                                <TextField
                                    label="Név"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    size="small"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.isCompany}
                                            onChange={handleToggleCompany}
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" color="text.secondary">
                                            {form.isCompany ? "Céges partner" : "Magánszemély"}
                                        </Typography>
                                    }
                                    sx={{ ml: 0 }}
                                />
                                {form.isCompany && (
                                    <TextField
                                        label="Adószám"
                                        name="tin"
                                        value={form.tin}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        error={tinError}
                                        helperText={tinError ? "Cég esetén az adószám kötelező." : ""}
                                        size="small"
                                    />
                                )}
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Right column — contact & address */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: CARD_RADIUS,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: CARD_SHADOW,
                                p: 2,
                            }}
                        >
                            <SectionLabel>Kapcsolat &amp; Cím</SectionLabel>
                            <Grid container spacing={1.5}>
                                <Grid size={12}>
                                    <TextField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <TextField
                                        label="Ország"
                                        name="country"
                                        value={form.country}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 5 }}>
                                    <TextField
                                        label="Irányítószám"
                                        name="zipCode"
                                        value={form.zipCode}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 5 }}>
                                    <TextField
                                        label="Város"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <TextField
                                        label="Utca, házszám"
                                        name="street"
                                        value={form.street}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                </Grid>

                <Divider sx={{ mt: 2.5, mb: 2 }} />

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        disableElevation
                        type="submit"
                        disabled={tinError || saving}
                        startIcon={<SaveIcon />}
                        sx={{ textTransform: "none", borderRadius: 1.5 }}
                    >
                        {saving ? "Mentés…" : "Mentés"}
                    </Button>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => navigate(isEdit ? `/partners/${id}` : "/partners")}
                        sx={{ textTransform: "none", borderRadius: 1.5, color: "text.secondary" }}
                    >
                        Mégse
                    </Button>
                </Stack>
            </form>
        </Container>
    );
}
