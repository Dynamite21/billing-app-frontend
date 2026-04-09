import { Container } from "@mui/material";
import InvoiceList from "../components/InvoiceList";

export default function InvoicesView() {
    return (
        <Container sx={{ mt: 3, mb: 6 }}>
            <InvoiceList />
        </Container>
    );
}
