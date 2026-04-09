import api from "./api";

export async function listPartners() {
    const { data } = await api.get('/partners');
    return data;
}

export async function savePartner(partner) {
    const { data } = await api.post('/partner/create', partner);
    return data;
}

export async function getPartner(id) {
    const { data } = await api.get(`/partner/${id}`);
    return data;
}

export async function updatePartner(id, partner) {
    const { data } = await api.put(`/partner/${id}`, partner);
    return data;
}

export async function deletePartner(id) {
    await api.delete(`/partner/${id}`);
}
