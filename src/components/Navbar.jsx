import { useState, useEffect } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Tooltip,
    Box,
    Avatar,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { getBillingAccount } from "../services/billingAccount";

const NAV_HEIGHT = 60;

export default function Navbar() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [anchorEl, setAnchorEl] = useState(null);
    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        setCompanyName("");
        if (!user) return;
        getBillingAccount()
            .then((data) => setCompanyName(data?.companyName || ""))
            .catch(() => {});
    }, [user]);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogout = async () => {
        handleMenuClose();
        await signOut(auth);
        navigate("/login", { replace: true });
    };

    const goToAccount = () => {
        handleMenuClose();
        navigate("/profile");
    };

const isActive = (path) => location.pathname.startsWith(path);

    const navBtnSx = (path) => ({
        height: NAV_HEIGHT,
        px: 2,
        borderRadius: 0,
        textTransform: "none",
        fontWeight: isActive(path) ? 600 : 500,
        fontSize: "0.875rem",
        letterSpacing: "0.015em",
        color: isActive(path) ? "#fff" : "rgba(255,255,255,0.65)",
        borderBottom: `2px solid ${isActive(path) ? "#818cf8" : "transparent"}`,
        "&:hover": {
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.95)",
            borderBottomColor: isActive(path) ? "#818cf8" : "rgba(255,255,255,0.2)",
        },
        transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
    });

    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                backgroundColor: "#0f172a",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            <Toolbar
                disableGutters
                sx={{
                    height: NAV_HEIGHT,
                    minHeight: `${NAV_HEIGHT}px !important`,
                    px: { xs: 2, sm: 3 },
                }}
            >
                {/* Brand */}
                <Box
                    component={Link}
                    to="/invoices"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        height: NAV_HEIGHT,
                        pr: 3,
                        mr: 1,
                        textDecoration: "none",
                        color: "#fff",
                        borderRight: "1px solid rgba(255,255,255,0.07)",
                        flexShrink: 0,
                        "&:hover .brand-icon": {
                            transform: "rotate(-8deg) scale(1.08)",
                            color: "#a5b4fc",
                        },
                        "&:hover .brand-label": { opacity: 1 },
                    }}
                >
                    <ReceiptLongIcon
                        className="brand-icon"
                        sx={{
                            fontSize: 20,
                            color: "#818cf8",
                            flexShrink: 0,
                            transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease",
                        }}
                    />
                    <Typography
                        className="brand-label"
                        sx={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            letterSpacing: "0.01em",
                            color: "#fff",
                            opacity: 0.9,
                            whiteSpace: "nowrap",
                            transition: "opacity 0.15s ease",
                            userSelect: "none",
                        }}
                    >
                        Számlázó
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "stretch", flexGrow: 1, height: NAV_HEIGHT }}>
                    <Button disableElevation component={Link} to="/invoices" sx={navBtnSx("/invoices")}>
                        Számlák
                    </Button>
                    <Button disableElevation component={Link} to="/partners" sx={navBtnSx("/partners")}>
                        Partnerek
                    </Button>
                    <Button disableElevation component={Link} to="/dashboard" sx={navBtnSx("/dashboard")}>
                        Statisztika
                    </Button>
                </Box>

                {!loading && (
                    user ? (
                        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                            <Tooltip title="Saját fiókom" arrow placement="bottom-end">
                                <IconButton
                                    onClick={handleMenuOpen}
                                    size="small"
                                    sx={{
                                        p: 0,
                                        borderRadius: "50%",
                                        outline: `2px solid ${open ? "#818cf8" : "rgba(255,255,255,0.18)"}`,
                                        outlineOffset: 2,
                                        transition: "outline-color 0.2s ease",
                                        "&:hover": { outlineColor: "rgba(129,140,248,0.55)" },
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 30,
                                            height: 30,
                                            fontSize: "0.78rem",
                                            fontWeight: 700,
                                            bgcolor: "#4338ca",
                                            letterSpacing: "0.03em",
                                        }}
                                    >
                                        {(companyName || user?.email)?.[0]?.toUpperCase() ?? "?"}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                                slotProps={{
                                    paper: {
                                        elevation: 8,
                                        sx: {
                                            mt: 1.5,
                                            minWidth: 228,
                                            borderRadius: 2,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            overflow: "hidden",
                                        },
                                    },
                                }}
                            >
                                {user?.email && (
                                    <Box sx={{ px: 2, pt: 1.75, pb: 1.5 }}>
                                        <Typography
                                            sx={{
                                                fontSize: "0.65rem",
                                                fontWeight: 600,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                color: "text.primary",
                                                mb: 0.4,
                                            }}
                                        >
                                            {companyName || "Bejelentkezve"}
                                        </Typography>
                                    </Box>
                                )}

                                <Divider />

                                <Box sx={{ py: 0.75, px: 0.75 }}>
                                    <MenuItem
                                        onClick={goToAccount}
                                        sx={{ borderRadius: 1.5, py: 1, px: 1.5, gap: 1.5 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: "unset", color: "text.secondary" }}>
                                            <AccountCircleIcon sx={{ fontSize: 18 }} />
                                        </ListItemIcon>
                                        <Typography variant="body2" fontWeight={500}>
                                            Saját fiókom
                                        </Typography>
                                    </MenuItem>

                                </Box>

                                <Divider />

                                <Box sx={{ py: 0.75, px: 0.75 }}>
                                    <MenuItem
                                        onClick={handleLogout}
                                        sx={{
                                            borderRadius: 1.5,
                                            py: 1,
                                            px: 1.5,
                                            gap: 1.5,
                                            color: "error.main",
                                            "&:hover": { backgroundColor: "rgba(239,68,68,0.07)" },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: "unset", color: "error.main" }}>
                                            <LogoutIcon sx={{ fontSize: 18 }} />
                                        </ListItemIcon>
                                        <Typography variant="body2" fontWeight={500}>
                                            Kijelentkezés
                                        </Typography>
                                    </MenuItem>
                                </Box>
                            </Menu>
                        </Box>
                    ) : (
                        <Button
                            component={Link}
                            to="/login"
                            variant="outlined"
                            size="small"
                            sx={{
                                color: "rgba(255,255,255,0.88)",
                                borderColor: "rgba(255,255,255,0.28)",
                                textTransform: "none",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                borderRadius: 1.5,
                                px: 2,
                                "&:hover": {
                                    borderColor: "rgba(255,255,255,0.6)",
                                    backgroundColor: "rgba(255,255,255,0.07)",
                                },
                            }}
                        >
                            Bejelentkezés
                        </Button>
                    )
                )}
            </Toolbar>
        </AppBar>
    );
}
