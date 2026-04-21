import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import InvoicesView from "./view/InvoicesView";
import PartnersView from "./view/PartnersView";
import InvoiceDetailsView from "./view/InvoiceDetailsView";
import InvoiceCreateView from "./view/InvoiceCreateView";
import LoginView from "./view/LoginView";

import RegistrationFormView from "./view/RegistrationFormView";

import FlashSnackbar from "./components/FlashSnackbar";

import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import UserProfileView from "./view/UserProfileView";
import DashboardView from "./view/DashboardView";
import PartnerDetailsView from "./view/PartnerDetailsView";
import PartnerFormView from "./view/PartnerFormView";

export default function App() {
    return (
        <AuthProvider>
                <Router>
                    <Navbar />
                    <FlashSnackbar />
                    <Routes>
                        <Route path="/" element={<Navigate to="/invoices" replace />} />

                        <Route path="/login" element={<LoginView />} />

                        <Route path="/register" element={<RegistrationFormView />} />

                        <Route
                            path="/invoices"
                            element={
                                <RequireAuth>
                                    <InvoicesView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/partners"
                            element={
                                <RequireAuth>
                                    <PartnersView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/partners/new"
                            element={
                                <RequireAuth>
                                    <PartnerFormView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/partners/:id"
                            element={
                                <RequireAuth>
                                    <PartnerDetailsView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/partners/:id/edit"
                            element={
                                <RequireAuth>
                                    <PartnerFormView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/invoices/new"
                            element={
                                <RequireAuth>
                                    <InvoiceCreateView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/invoices/:id"
                            element={
                                <RequireAuth>
                                    <InvoiceDetailsView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/dashboard"
                            element={
                                <RequireAuth>
                                    <DashboardView />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <RequireAuth>
                                    <UserProfileView />
                                </RequireAuth>
                            }
                        />

                        <Route path="*" element={<Navigate to="/invoices" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
    );
}
