import { Container, Paper, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import InvoiceForm from "../components/InvoiceForm";

export default function InvoiceCreateView() {
    const navigate = useNavigate();

    return (
        <Container sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h5">Új számla létrehozása</Typography>
                    <Button variant="outlined" onClick={() => navigate("/invoices")}>
                        Vissza a listához
                    </Button>
                </Stack>

                <InvoiceForm
                    onClose={() => navigate("/invoices")}
                    onSaved={() => navigate("/invoices")}
                />
            </Paper>
        </Container>
    );
}
