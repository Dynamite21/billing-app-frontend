import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Navbar from "./components/Navbar";
import InvoicesView from "./view/InvoicesView";
import PartnersView from "./view/PartnersView";
import InvoiceDetails from "./components/InvoiceDetails";
import InvoiceCreateView from "./components/InvoiceCreateView";
import Login from "./login/Login";

import RegistrationForm from "./components/RegistrationForm";

import FlashSnackbar from "./components/FlashSnackbar";

import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import UserProfile from "./components/UserProfile";
import DashboardView from "./view/DashboardView";
import PartnerDetailsView from "./view/PartnerDetailsView";
import PartnerFormView from "./view/PartnerForm";

const queryClient = new QueryClient();

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <Navbar />
                    <FlashSnackbar />
                    <Routes>
                        <Route path="/" element={<Navigate to="/invoices" replace />} />

                        <Route path="/login" element={<Login />} />

                        <Route path="/register" element={<RegistrationForm />} />

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
                                    <InvoiceDetails />
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
                                    <UserProfile />
                                </RequireAuth>
                            }
                        />

                        <Route path="*" element={<Navigate to="/invoices" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
}
