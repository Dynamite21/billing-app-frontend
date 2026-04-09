import { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Paper,
    Stack,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
} from "@mui/material";

import { savePartner } from "../services/partners";

export default function PartnerForm({ initialData, onClose }) {
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

    useEffect(() => {
        if (initialData) {
            setForm({
                id: initialData.id ?? null,
                name: initialData.name || "",
                isCompany: Boolean(initialData.isCompany),
                tin: initialData.tin || "",
                country: initialData.country || "",
                zipCode: initialData.zipCode || "",
                city: initialData.city || "",
                street: initialData.street || "",
                email: initialData.email || "",
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleToggleCompany = (e) => {
        const checked = e.target.checked;

        setForm((prev) => ({
            ...prev,
            isCompany: checked,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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

            if (form.id) {
                payload.partnerData.id = form.id;
            }

            await savePartner(payload);
            onClose();
        } catch (err) {
            console.error("Mentési hiba:", err);
        }
    };

    const tinError = form.isCompany && !form.tin?.trim();

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                {form.id ? "Partner szerkesztése" : "Új partner"}
            </Typography>

            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <TextField
                        label="Név"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        fullWidth
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={form.isCompany}
                                onChange={handleToggleCompany}
                            />
                        }
                        label={form.isCompany ? "Cég" : "Magánszemély"}
                    />

                    {form.isCompany && (
                        <>
                            <Divider sx={{ my: 1 }} />

                            <TextField
                                label="Adószám"
                                name="tin"
                                value={form.tin}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={tinError}
                                helperText={tinError ? "Cég esetén az adószám kötelező." : ""}
                            />
                        </>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Ország"
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Irányítószám"
                            name="zipCode"
                            value={form.zipCode}
                            onChange={handleChange}
                            sx={{ minWidth: 130 }}
                        />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Város"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Utca, házszám"
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Stack>

                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        fullWidth
                    />

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={tinError}
                        >
                            Mentés
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={onClose}
                        >
                            Mégse
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Paper>
    );
}
