import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Radio,
    Grid,
    Alert,
    Divider,
    Stack,
    InputAdornment,
} from "@mui/material";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";

import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { createBillingAccount } from "../services/billingAccount";
import { formatBankAccountNumber } from "../utils/bankAccountFormat";

const ACCOUNT_TYPES = [
    { value: "COMPANY", label: "Cég" },
    { value: "SOLE_PROPRIETOR", label: "Egyéni vállalkozó" },
    { value: "OTHER_ORGANIZATION", label: "Egyéb szervezet" },
];

const COMPANY_NAME_LABEL = {
    COMPANY: "Cégnév *",
    SOLE_PROPRIETOR: "Vállalkozó neve *",
    OTHER_ORGANIZATION: "Szervezet neve *",
};

const ADORNMENT_SX = { fontSize: 18, color: "rgba(0,0,0,0.32)" };

function AccountTypeCard({ value, label, selected, onChange }) {
    return (
        <Box
            onClick={() => onChange(value)}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.875,
                border: "1px solid",
                borderColor: selected ? "primary.main" : "rgba(0,0,0,0.18)",
                borderRadius: 1.5,
                backgroundColor: selected ? "rgba(25,118,210,0.05)" : "transparent",
                cursor: "pointer",
                userSelect: "none",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": {
                    borderColor: selected ? "primary.main" : "rgba(0,0,0,0.38)",
                    backgroundColor: selected ? "rgba(25,118,210,0.08)" : "rgba(0,0,0,0.02)",
                },
            }}
        >
            <Radio
                checked={selected}
                onChange={() => onChange(value)}
                size="small"
                disableRipple
                sx={{
                    p: 0,
                    color: "rgba(0,0,0,0.28)",
                    "&.Mui-checked": { color: "primary.main" },
                }}
            />
            <Typography
                variant="body2"
                sx={{
                    fontSize: "0.845rem",
                    fontWeight: selected ? 500 : 400,
                    color: selected ? "primary.main" : "text.primary",
                    lineHeight: 1,
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

function SectionLabel({ children }) {
    return (
        <Box sx={{ px: 3, pt: 2.5, pb: 1.25 }}>
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

export default function RegistrationFormView({ onToken }) {
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from?.pathname || "/invoices";

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const [email, setEmail] = useState("");
    const [pass1, setPass1] = useState("");
    const [pass2, setPass2] = useState("");

    const [form, setForm] = useState({
        accountType: "COMPANY",
        companyName: "",
        taxNumber: "",
        companyEmail: "",
        bankAccountNumber: "",
        postalCode: "",
        city: "",
        streetAndHouseNumber: "",
    });

    function setField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function validate() {
        if (!email.trim()) return "Az e-mail kötelező.";
        if (!pass1) return "A jelszó kötelező.";
        if (!pass2) return "A jelszó megerősítése kötelező.";
        if (pass1 !== pass2) return "A két jelszó nem egyezik.";

        if (!form.companyName.trim()) return "A cégnév kötelező.";
        if (!form.taxNumber.trim()) return "Az adószám kötelező.";
        if (!form.companyEmail.trim()) return "A számlázási e-mail kötelező.";
        if (!form.postalCode.trim()) return "Az irányítószám kötelező.";
        if (!form.city.trim()) return "A város kötelező.";
        if (!form.streetAndHouseNumber.trim()) return "Az utca, házszám kötelező.";
        if (!form.bankAccountNumber.trim()) return "A bankszámlaszám kötelező.";

        return "";
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        const v = validate();
        if (v) {
            setError(v);
            return;
        }

        setSaving(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass1);
            const token = await cred.user.getIdToken();
            onToken?.(token);

            await createBillingAccount({ ...form });

            navigate(redirectTo, {
                replace: true,
                state: { flash: { text: "Sikeres regisztráció! Fiók létrehozva.", severity: "success" } },
            });
        } catch (err) {
            setError("Regisztráció sikertelen: " + String(err?.code || err?.message || "ismeretlen hiba"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Box sx={{ maxWidth: 860, mx: "auto", mt: 5, mb: 8, px: { xs: 2, sm: 3 } }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
                <Box>
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
                    >
                        Regisztráció
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        Hozzon létre számlázási fiókot az induláshoz
                    </Typography>
                </Box>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                <form onSubmit={handleSubmit}>

                    <SectionLabel>Fiók adatok</SectionLabel>

                    <Box sx={{ px: 3, pb: 3 }}>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="E-mail *"
                                    type="email"
                                    fullWidth
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AlternateEmailOutlinedIcon sx={ADORNMENT_SX} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Jelszó *"
                                    type="password"
                                    fullWidth
                                    value={pass1}
                                    onChange={(e) => setPass1(e.target.value)}
                                    autoComplete="new-password"
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlinedIcon sx={ADORNMENT_SX} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Jelszó újra *"
                                    type="password"
                                    fullWidth
                                    value={pass2}
                                    onChange={(e) => setPass2(e.target.value)}
                                    autoComplete="new-password"
                                    error={Boolean(pass2) && pass1 !== pass2}
                                    helperText={Boolean(pass2) && pass1 !== pass2 ? "Nem egyezik." : " "}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlinedIcon sx={ADORNMENT_SX} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    <SectionLabel>Számlázási adatok</SectionLabel>

                    <Box sx={{ px: 3, pb: 3 }}>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12}>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {ACCOUNT_TYPES.map((t) => (
                                        <AccountTypeCard
                                            key={t.value}
                                            value={t.value}
                                            label={t.label}
                                            selected={form.accountType === t.value}
                                            onChange={(v) => setField("accountType", v)}
                                        />
                                    ))}
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label={COMPANY_NAME_LABEL[form.accountType] ?? "Cégnév *"}
                                    fullWidth
                                    value={form.companyName}
                                    onChange={(e) => setField("companyName", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Adószám *"
                                    fullWidth
                                    value={form.taxNumber}
                                    onChange={(e) => setField("taxNumber", e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={4} sm={3}>
                                <TextField
                                    label="Irányítószám *"
                                    fullWidth
                                    value={form.postalCode}
                                    onChange={(e) => setField("postalCode", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={8} sm={9}>
                                <TextField
                                    label="Város *"
                                    fullWidth
                                    value={form.city}
                                    onChange={(e) => setField("city", e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Utca, házszám *"
                                    fullWidth
                                    value={form.streetAndHouseNumber}
                                    onChange={(e) => setField("streetAndHouseNumber", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Számlázási e-mail *"
                                    fullWidth
                                    value={form.companyEmail}
                                    onChange={(e) => setField("companyEmail", e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AlternateEmailOutlinedIcon sx={ADORNMENT_SX} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Bankszámlaszám *"
                                    fullWidth
                                    value={form.bankAccountNumber}
                                    onChange={(e) =>
                                        setField("bankAccountNumber", formatBankAccountNumber(e.target.value))
                                    }
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AccountBalanceOutlinedIcon sx={ADORNMENT_SX} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ px: 3, py: 2 }}
                    >
                        <Typography variant="caption" color="text.disabled">
                            * kötelezően kitöltendő mező
                        </Typography>
                        <Button
                            type="submit"
                            variant="contained"
                            disableElevation
                            disabled={saving}
                            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                        >
                            {saving ? "Regisztráció..." : "Fiók létrehozása"}
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Box>
    );
}
