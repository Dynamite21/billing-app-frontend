import api from "./api";

export async function getBillingAccount() {
    const { data } = await api.get("/billing-account");
    return data;
}

export async function createBillingAccount(billingAccount) {
    const { data } = await api.post("/billing-account/create", billingAccount);
    return data;
}

export async function updateBillingAccount(billingAccount) {
    const { data } = await api.put(`/billing-account`, billingAccount);
    return data;
}

export async function deleteBillingAccount(id) {
    await api.delete(`/billing-account/${id}`);
}