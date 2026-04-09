import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";

export default function FlashSnackbar() {
    const location = useLocation();
    const navigate = useNavigate();

    const flash = location.state?.flash;
    const [open, setOpen] = useState(Boolean(flash));

    useEffect(() => {
        setOpen(Boolean(flash));
    }, [flash]);

    const handleClose = () => {
        setOpen(false);

        navigate(location.pathname, { replace: true, state: {} });
    };

    if (!flash) return null;

    return (
        <Snackbar
            open={open}
            autoHideDuration={2500}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <Alert onClose={handleClose} severity={flash.severity || "success"} variant="filled">
                {flash.text}
            </Alert>
        </Snackbar>
    );
}
