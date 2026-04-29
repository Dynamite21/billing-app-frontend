import { useState, useEffect, useRef } from "react";
import {
    TextField,
    Button,
    Paper,
    Stack,
    Typography,
    MenuItem,
    IconButton,
    Divider,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    InputAdornment,
    Alert,
    Switch,
    FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { createInvoice } from "../services/invoices";
import { listPartners, savePartner } from "../services/partners";

const paymentMethods = [
    { value: "CARD", label: "Bankkártya" },
    { value: "BANK_TRANSFER", label: "Átutalás" },
    { value: "CASH", label: "Készpénz" },
    { value: "CHECK", label: "Csekk" },
    { value: "PAYPAL", label: "PayPal" },
    { value: "SZEP_CARD", label: "SZÉP kártya" },
    { value: "OTP_SIMPLE", label: "OTP SimplePay" },
];

const emptyPartnerForm = {
    name: "",
    isCompany: false,
    tin: "",
    country: "",
    zipCode: "",
    city: "",
    street: "",
    email: "",
};

// ── Helpers ────────────────────────────────────────────────

function SectionHeader({ children }) {
    return (
        <Typography
            variant="overline"
            sx={{
                display: "block",
                color: "text.secondary",
                fontWeight: 700,
                letterSpacing: 1.2,
                mb: 0.5,
                mt: 1,
            }}
        >
            {children}
        </Typography>
    );
}

/** Date field that opens the native picker on any click, not just the icon. */
function DateField({ label, name, value, onChange, required, disabled }) {
    const inputRef = useRef(null);

    return (
        <TextField
            label={label}
            name={name}
            type="date"
            value={value}
            onChange={onChange}
            onClick={disabled ? undefined : () => inputRef.current?.showPicker?.()}
            fullWidth
            required={required}
            disabled={disabled}
            inputRef={inputRef}
            InputLabelProps={{ shrink: true }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end" sx={{ pointerEvents: "none" }}>
                        <CalendarTodayIcon fontSize="small" color="action" />
                    </InputAdornment>
                ),
            }}
            sx={{
                cursor: disabled ? "default" : "pointer",
                "& input[type='date']::-webkit-calendar-picker-indicator": { display: "none" },
                "& input[type='date']": {
                    color: value ? undefined : "rgba(0,0,0,0.38)",
                },
                "& input[type='date']:focus": {
                    color: value ? undefined : "transparent !important",
                },
            }}
        />
    );
}

/** Number input that shows formatted thousands while idle, raw digits while editing. */
function PriceField({ value, name, onChange, required }) {
    const [focused, setFocused] = useState(false);

    const raw = value === "" || value === 0 ? "" : String(value);
    const formatted =
        value === "" || value === 0
            ? ""
            : Number(value).toLocaleString("hu-HU");

    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onChange({ target: { name, value: digits } });
    };

    return (
        <TextField
            value={focused ? raw : formatted}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="0"
            required={required}
            size="small"
            inputProps={{ inputMode: "numeric" }}
            InputProps={{
                endAdornment: <InputAdornment position="end">Ft</InputAdornment>,
            }}
            sx={{ flex: 1.5 }}
        />
    );
}

const localDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ── Main component ─────────────────────────────────────────

export default function InvoiceForm({ initialData, onClose, onSaved }) {
    const [form, setForm] = useState({
        id: null,
        date: localDateString(),
        dueDate: "",
        completionDate: "",
        paymentMethod: "",
        partnerId: "",
        items: [],
    });

    const [partners, setPartners] = useState([]);
    const [formError, setFormError] = useState("");
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [newPartner, setNewPartner] = useState(emptyPartnerForm);
    const [savingPartner, setSavingPartner] = useState(false);
    const [quickAddError, setQuickAddError] = useState("");

    const loadPartners = async () => {
        try {
            const data = await listPartners();
            setPartners(data);
        } catch (err) {
            console.error("Partnerek betöltése sikertelen:", err);
        }
    };

    useEffect(() => { loadPartners(); }, []);

    useEffect(() => {
        if (initialData) {
            setForm({
                id: initialData.id ?? null,
                date: initialData.date ? initialData.date.substring(0, 10) : localDateString(),
                dueDate: initialData.dueDate ? initialData.dueDate.substring(0, 10) : "",
                completionDate: initialData.completionDate ? initialData.completionDate.substring(0, 10) : "",
                paymentMethod: initialData.paymentMethod || "",
                partnerId: initialData.partnerId || "",
                items:
                    initialData.items?.map((i) => ({
                        productName: i.productName,
                        productAmount: i.productAmount,
                        productUnit: i.productUnit,
                        amount: i.amount,
                        taxRate: i.taxRate,
                    })) || [],
            });
        }
    }, [initialData]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleItemChange = (index, e) => {
        const updated = [...form.items];
        updated[index][e.target.name] = e.target.value;
        setForm({ ...form, items: updated });
    };

    const addItem = () => {
        setForm({
            ...form,
            items: [
                ...form.items,
                { productName: "", productAmount: 1, productUnit: "", amount: "", taxRate: 27 },
            ],
        });
    };

    const removeItem = (index) => {
        const updated = [...form.items];
        updated.splice(index, 1);
        setForm({ ...form, items: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (form.items.length === 0) {
            setFormError("Legalább egy tételt meg kell adni a számlán.");
            return;
        }

        try {
            const selectedPartner = partners.find((p) => p.id === form.partnerId);

            const payload = {
                date: form.date,
                dueDate: form.dueDate || null,
                completionDate: form.completionDate || null,
                paymentMethod: form.paymentMethod || null,
                storno: false,
                partnerData: selectedPartner?.partnerData ?? null,
                items: form.items.map((i) => ({
                    productName: i.productName,
                    productAmount: parseInt(i.productAmount, 10),
                    productUnit: i.productUnit,
                    amount: parseFloat(i.amount),
                    taxRate: parseFloat(i.taxRate),
                })),
            };

            const saved = await createInvoice(payload);
            if (onSaved) onSaved(saved);
        } catch (err) {
            console.error("Mentési hiba:", err);
            setFormError("Hiba történt a mentés során. Kérjük próbáld újra.");
        }
    };

    // Quick-add partner
    const handleNewPartnerChange = (e) => {
        const { name, value } = e.target;
        setNewPartner((prev) => ({ ...prev, [name]: value }));
    };

    const handleQuickAddSave = async () => {
        setSavingPartner(true);
        setQuickAddError("");
        try {
            await savePartner({
                partnerData: {
                    ...newPartner,
                    tin: newPartner.isCompany ? newPartner.tin : null,
                },
            });
            await loadPartners();
            setQuickAddOpen(false);
            setNewPartner(emptyPartnerForm);
        } catch (err) {
            console.error("Partner mentési hiba:", err);
            setQuickAddError("Mentés sikertelen. Kérjük, próbálja újra.");
        } finally {
            setSavingPartner(false);
        }
    };

    const nettoTotal = form.items.reduce(
        (sum, i) => sum + parseFloat(i.amount || 0) * parseFloat(i.productAmount || 0),
        0
    );
    const bruttoTotal = form.items.reduce(
        (sum, i) =>
            sum +
            parseFloat(i.amount || 0) *
                parseFloat(i.productAmount || 0) *
                (1 + parseFloat(i.taxRate || 0) / 100),
        0
    );

    return (
        <>
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>

                    <Box>
                        <SectionHeader>Dátumok</SectionHeader>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <DateField
                                label="Számla dátuma"
                                name="date"
                                value={form.date}
                                onChange={() => {}}
                                disabled
                            />
                            <DateField
                                label="Fizetési határidő"
                                name="dueDate"
                                value={form.dueDate}
                                onChange={handleChange}
                                required
                            />
                            <DateField
                                label="Teljesítési dátum"
                                name="completionDate"
                                value={form.completionDate}
                                onChange={handleChange}
                                required
                            />
                        </Stack>
                    </Box>

                    <Box>
                        <SectionHeader>Partner & Fizetés</SectionHeader>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
                            <Stack direction="row" spacing={1} sx={{ flex: 1 }} alignItems="center">
                                <TextField
                                    select
                                    label="Partner"
                                    name="partnerId"
                                    value={form.partnerId}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                >
                                    <MenuItem value="" disabled>— Válassz partnert —</MenuItem>
                                    {partners.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.partnerData?.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Tooltip title="Új partner gyors hozzáadása">
                                    <IconButton
                                        color="primary"
                                        onClick={() => setQuickAddOpen(true)}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: "primary.main",
                                            borderRadius: 1,
                                            height: 56,
                                            width: 56,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PersonAddIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            <TextField
                                select
                                label="Fizetési mód"
                                name="paymentMethod"
                                value={form.paymentMethod}
                                onChange={handleChange}
                                sx={{ flex: 1, minWidth: 200 }}
                                required
                            >
                                <MenuItem value="" disabled>— Válassz —</MenuItem>
                                {paymentMethods.map((pm) => (
                                    <MenuItem key={pm.value} value={pm.value}>{pm.label}</MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                    </Box>

                    <Box>
                        <SectionHeader>Tételek</SectionHeader>

                        <Stack spacing={1.5}>
                            {form.items.length > 0 && (
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ px: 1.5, display: { xs: "none", md: "flex" } }}
                                >
                                    {[
                                        { label: "Termék / Szolgáltatás", flex: 2 },
                                        { label: "Mennyiség", flex: 1 },
                                        { label: "Egység", flex: 1 },
                                        { label: "Egységár", flex: 1.5 },
                                        { label: "ÁFA (%)", flex: 1 },
                                    ].map(({ label, flex }) => (
                                        <Typography
                                            key={label}
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight={600}
                                            sx={{ flex }}
                                        >
                                            {label}
                                        </Typography>
                                    ))}
                                    <Box sx={{ width: 34 }} />
                                </Stack>
                            )}

                            {form.items.map((item, index) => (
                                <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center">
                                        <TextField
                                            placeholder="Termék / Szolgáltatás"
                                            name="productName"
                                            value={item.productName}
                                            onChange={(e) => handleItemChange(index, e)}
                                            size="small"
                                            sx={{ flex: 2 }}
                                            required
                                        />
                                        <TextField
                                            placeholder="Mennyiség"
                                            name="productAmount"
                                            type="number"
                                            value={item.productAmount}
                                            onChange={(e) => handleItemChange(index, e)}
                                            size="small"
                                            sx={{ flex: 1 }}
                                            inputProps={{ min: 1 }}
                                            required
                                        />
                                        <TextField
                                            placeholder="Egység"
                                            name="productUnit"
                                            value={item.productUnit}
                                            onChange={(e) => handleItemChange(index, e)}
                                            size="small"
                                            sx={{ flex: 1 }}
                                            required
                                        />
                                        <PriceField
                                            name="amount"
                                            value={item.amount}
                                            onChange={(e) => handleItemChange(index, e)}
                                            required
                                        />
                                        <TextField
                                            placeholder="ÁFA %"
                                            name="taxRate"
                                            type="number"
                                            value={item.taxRate}
                                            onChange={(e) => handleItemChange(index, e)}
                                            size="small"
                                            sx={{ flex: 1 }}
                                            inputProps={{ min: 0, max: 100 }}
                                            required
                                        />
                                        <IconButton
                                            onClick={() => removeItem(index)}
                                            color="error"
                                            size="small"
                                            sx={{ flexShrink: 0 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Paper>
                            ))}

                            <Button
                                onClick={addItem}
                                variant="outlined"
                                startIcon={<AddIcon />}
                                sx={{ alignSelf: "flex-start" }}
                            >
                                Új tétel hozzáadása
                            </Button>
                        </Stack>

                        {form.items.length > 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "grey.50",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 4,
                                }}
                            >
                                <Box textAlign="right">
                                    <Typography variant="caption" color="text.secondary">
                                        Nettó összesen
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {nettoTotal.toLocaleString("hu-HU")} Ft
                                    </Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="caption" color="text.secondary">
                                        Bruttó összesen
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={700} color="primary">
                                        {bruttoTotal.toLocaleString("hu-HU")} Ft
                                    </Typography>
                                </Box>
                            </Paper>
                        )}
                    </Box>

                    {formError && <Alert severity="error">{formError}</Alert>}

                    <Divider />

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={onClose}>
                            Mégse
                        </Button>
                        <Button variant="contained" type="submit" size="large">
                            Számla mentése
                        </Button>
                    </Stack>
                </Stack>
            </form>

            <Dialog open={quickAddOpen} onClose={() => { setQuickAddOpen(false); setQuickAddError(""); }} maxWidth="sm" fullWidth>
                <DialogTitle>Új partner gyors hozzáadása</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Név"
                            name="name"
                            value={newPartner.name}
                            onChange={handleNewPartnerChange}
                            fullWidth
                            required
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Ország"
                                name="country"
                                value={newPartner.country}
                                onChange={handleNewPartnerChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Irányítószám"
                                name="zipCode"
                                value={newPartner.zipCode}
                                onChange={handleNewPartnerChange}
                                sx={{ minWidth: 130 }}
                                required
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Város"
                                name="city"
                                value={newPartner.city}
                                onChange={handleNewPartnerChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Utca, házszám"
                                name="street"
                                value={newPartner.street}
                                onChange={handleNewPartnerChange}
                                fullWidth
                                required
                            />
                        </Stack>
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={newPartner.email}
                            onChange={handleNewPartnerChange}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={newPartner.isCompany}
                                    onChange={(e) =>
                                        setNewPartner((prev) => ({
                                            ...prev,
                                            isCompany: e.target.checked,
                                            tin: e.target.checked ? prev.tin : "",
                                        }))
                                    }
                                />
                            }
                            label={newPartner.isCompany ? "Cég" : "Magánszemély"}
                        />
                        {newPartner.isCompany && (
                            <TextField
                                label="Adószám"
                                name="tin"
                                value={newPartner.tin}
                                onChange={handleNewPartnerChange}
                                fullWidth
                                required
                            />
                        )}
                    </Stack>
                </DialogContent>
                {quickAddError && (
                    <Box sx={{ px: 3, pb: 1 }}>
                        <Alert severity="error">{quickAddError}</Alert>
                    </Box>
                )}
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setQuickAddOpen(false); setQuickAddError(""); }}>Mégse</Button>
                    <Button
                        variant="contained"
                        onClick={handleQuickAddSave}
                        disabled={savingPartner || !newPartner.name.trim()}
                    >
                        Mentés
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
