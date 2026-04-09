import { Container, Paper } from "@mui/material";
import PartnerList from "../components/PartnerList";

const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)";
const CARD_RADIUS = 2.5;

export default function PartnersView() {
    return (
        <Container sx={{ mt: 3, mb: 8 }}>
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
                <PartnerList />
            </Paper>
        </Container>
    );
}
