import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

import { Paper, Stack, Typography, TextField, Button, Alert, Link } from "@mui/material";

export default function LoginView({ onToken }) {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const goInvoicesWithFlash = (text, severity = "success") => {
        navigate("/invoices", {
            replace: true,
            state: { flash: { text, severity } },
        });
    };

    const login = async () => {
        setMsg("");
        setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            const token = await cred.user.getIdToken();
            onToken?.(token);

            goInvoicesWithFlash("Sikeres bejelentkezés.", "success");
        } catch (e) {
            setMsg("Hiba: " + (e.code || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 4, mt: 6, maxWidth: 420, mx: "auto" }}>
            <Typography variant="h5" gutterBottom>
                Bejelentkezés
            </Typography>

            <Stack spacing={3}>
                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    autoComplete="email"
                />

                <TextField
                    label="Jelszó"
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    fullWidth
                    autoComplete="current-password"
                />

                <Button variant="contained" onClick={login} fullWidth disabled={loading}>
                    {loading ? "Belépés..." : "Belépés"}
                </Button>

                <Typography variant="body2" sx={{ textAlign: "center" }}>
                    Nincs még fiókod?{" "}
                    <Link component={RouterLink} to="/register" underline="hover">
                        Regisztráció
                    </Link>
                </Typography>

                {msg && <Alert severity="error">{msg}</Alert>}
            </Stack>
        </Paper>
    );
}
