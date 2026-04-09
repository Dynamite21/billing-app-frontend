import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Divider,
    Grid,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { getBillingAccount, updateBillingAccount } from "../services/billingAccount";
import { formatBankAccountNumber } from "../utils/bankAccountFormat";

const ACCOUNT_TYPE_LABEL = {
    COMPANY: "Cég",
    SOLE_PROPRIETOR: "Egyéni vállalkozó",
    TAXABLE_PRIVATE_PERSON: "Magánszemély",
    OTHER_ORGANIZATION: "Egyéb szervezet",
};


const LOCKED_SX = {
    "& .MuiInputBase-input.Mui-disabled": {
        WebkitTextFillColor: "rgba(0,0,0,0.7)",
        cursor: "default",
    },
    "& .MuiOutlinedInput-root.Mui-disabled": {
        backgroundColor: "rgba(0,0,0,0.025)",
    },
    "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(0,0,0,0.11)",
    },
    "& .MuiFormLabel-root.Mui-disabled": {
        color: "rgba(0,0,0,0.5)",
    },
    "& .MuiInputAdornment-root.Mui-disabled": {
        opacity: 1,
    },
};


const READ_ONLY_SX = {
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(0,0,0,0.23)",
        borderWidth: "1px",
    },
    "& input": {
        caretColor: "transparent",
        cursor: "default",
    },
};


function LockedField({ label, value, isEditing = false, sx: sxProp, slotPropsExtra }) {
    const field = (
        <TextField
            label={label}
            value={value}
            fullWidth
            disabled
            slotProps={{
                input: {
                    endAdornment: isEditing ? (
                        <InputAdornment position="end">
                            <LockOutlinedIcon sx={{ fontSize: 15, color: "rgba(0,0,0,0.28)" }} />
                        </InputAdornment>
                    ) : undefined,
                    ...slotPropsExtra,
                },
            }}
            sx={{ ...LOCKED_SX, ...sxProp }}
        />
    );

    if (isEditing) {
        return (
            <Tooltip title="Ez a mező nem módosítható" placement="top-end" arrow>
                {/* Box wrapper allows Tooltip to fire on a disabled element */}
                <Box sx={{ display: "block", width: "100%" }}>{field}</Box>
            </Tooltip>
        );
    }

    return field;
}


function EditableField({ label, value, onChange, isEditing, sx: sxProp, slotProps: slotPropsProp, ...rest }) {
    return (
        <TextField
            label={label}
            value={value}
            fullWidth
            onChange={onChange}
            slotProps={{
                ...slotPropsProp,
                input: { readOnly: !isEditing, ...slotPropsProp?.input },
            }}
            // inputProps targets the native <input> element — prevents focus behaviour in view mode
            inputProps={
                !isEditing
                    ? {
                          tabIndex: -1,
                          onMouseDown: (e) => e.preventDefault(),
                          style: { cursor: "default", caretColor: "transparent" },
                      }
                    : undefined
            }
            sx={!isEditing ? { ...READ_ONLY_SX, ...sxProp } : sxProp}
            {...rest}
        />
    );
}


export default function UserProfile() {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState({});
    const [originalForm, setOriginalForm] = useState({});

    const isPrivatePerson = form.accountType === "TAXABLE_PRIVATE_PERSON";

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await getBillingAccount();
            if (!data) return;

            const normalized = {
                accountType: data.accountType || "COMPANY",
                companyName: data.companyName || "",
                taxNumber: data.taxNumber || "",
                companyEmail: data.companyEmail || "",
                bankAccountNumber: formatBankAccountNumber(data.bankAccountNumber || ""),
                postalCode: data.postalCode || "",
                city: data.city || "",
                streetAndHouseNumber: data.streetAndHouseNumber || "",
            };

            setForm(normalized);
            setOriginalForm(normalized);
        } catch {
            setError("Nem sikerült betölteni az adatokat.");
        } finally {
            setLoading(false);
        }
    }

    function setField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleCancel() {
        setForm(originalForm);
        setIsEditing(false);
        setError("");
    }

    async function handleSave() {
        setError("");
        setSuccess("");

        const payload = {
            ...form,
            accountType: originalForm.accountType,
            companyName: originalForm.companyName,
            taxNumber:
                originalForm.accountType === "TAXABLE_PRIVATE_PERSON"
                    ? null
                    : originalForm.taxNumber,
        };

        try {
            await updateBillingAccount(payload);
            setOriginalForm(payload);
            setForm(payload);
            setIsEditing(false);
            setSuccess("Profil sikeresen frissítve.");
        } catch {
            setError("Mentés sikertelen.");
        }
    }

    if (loading) {
        return (
            <Typography color="text.secondary" sx={{ mt: 6, textAlign: "center" }}>
                Betöltés…
            </Typography>
        );
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
                        Saját fiókom
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        Számlázási fiók adatai és beállításai
                    </Typography>
                </Box>

                {!isEditing && (
                    <Button
                        variant="contained"
                        disableElevation
                        onClick={() => setIsEditing(true)}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, mt: 0.25 }}
                    >
                        Szerkesztés
                    </Button>
                )}
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2.5 }}>{success}</Alert>}

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>

                <SectionLabel>Azonosítás</SectionLabel>

                <Box sx={{ px: 3, pb: 3 }}>
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                            <LockedField
                                label="Fióktípus"
                                value={ACCOUNT_TYPE_LABEL[form.accountType] || form.accountType}
                                isEditing={isEditing}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <EditableField
                                label="Számlázási e-mail"
                                value={form.companyEmail}
                                onChange={(e) => setField("companyEmail", e.target.value)}
                                isEditing={isEditing}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <LockedField
                                label="Név / Cégnév"
                                value={form.companyName}
                                isEditing={isEditing}
                            />
                        </Grid>

                        {!isPrivatePerson && (
                            <Grid item xs={12} sm={6}>
                                <LockedField
                                    label="Adószám"
                                    value={form.taxNumber}
                                    isEditing={isEditing}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Box>

                <Divider />

                <SectionLabel>Cím</SectionLabel>

                <Box sx={{ px: 3, pb: 3 }}>
                    <Grid container spacing={2.5}>
                        <Grid item xs={4} sm={3}>
                            <EditableField
                                label="Irányítószám"
                                value={form.postalCode}
                                onChange={(e) => setField("postalCode", e.target.value)}
                                isEditing={isEditing}
                            />
                        </Grid>

                        <Grid item xs={8} sm={9}>
                            <EditableField
                                label="Város"
                                value={form.city}
                                onChange={(e) => setField("city", e.target.value)}
                                isEditing={isEditing}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <EditableField
                                label="Utca, házszám"
                                value={form.streetAndHouseNumber}
                                onChange={(e) => setField("streetAndHouseNumber", e.target.value)}
                                isEditing={isEditing}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Divider />

                <SectionLabel>Fizetési adatok</SectionLabel>

                <Box sx={{ px: 3, pb: 3 }}>
                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <EditableField
                                label="Bankszámlaszám"
                                value={form.bankAccountNumber}
                                onChange={(e) =>
                                    setField("bankAccountNumber", formatBankAccountNumber(e.target.value))
                                }
                                isEditing={isEditing}
                                sx={{ "& .MuiInputBase-input": { textOverflow: "clip" } }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountBalanceOutlinedIcon
                                                    sx={{ fontSize: 18, color: "rgba(0,0,0,0.32)" }}
                                                />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {isEditing && (
                    <>
                        <Divider />
                        <Stack
                            direction="row"
                            spacing={1.5}
                            justifyContent="flex-end"
                            sx={{ px: 3, py: 2 }}
                        >
                            <Button
                                variant="outlined"
                                onClick={handleCancel}
                                sx={{ textTransform: "none", fontWeight: 500, borderRadius: 1.5 }}
                            >
                                Mégse
                            </Button>
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={handleSave}
                                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                            >
                                Mentés
                            </Button>
                        </Stack>
                    </>
                )}
            </Paper>
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
