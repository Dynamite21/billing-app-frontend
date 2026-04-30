import api from "./api";

export async function listInvoices(params = {}) {
    const {
        page = 0,
        size = 20,
        sortBy = "date",
        sortDir = "desc",
        ...filters
    } = params;

    const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v != null)
    );

    const SORT_FIELD_MAP = {
        partnerName: "partnerData.name",
        brutto: "grossAmount",
    };
    const backendField = SORT_FIELD_MAP[sortBy] ?? sortBy;

    const sort = sortBy === "date"
        ? [`date,${sortDir}`, `invoiceNumber,${sortDir}`]
        : `${backendField},${sortDir}`;

    const queryParams = {
        page,
        size,
        sort,
        ...activeFilters,
    };

    const { data } = await api.get("/invoices", {
        params: queryParams,
    });

    return data;
}

export async function createInvoice(invoice) {
    const { data } = await api.post("/invoices/create", invoice);
    return data;
}

export async function getInvoice(id) {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
}

export async function deleteInvoice(id) {
    await api.delete(`/invoices/${id}`);
}

export async function downloadInvoice(id, invoiceNumber) {
    const res = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${invoiceNumber || "invoice"}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export async function markInvoiceAsStorno(id) {
    await api.patch(`/invoices/${id}/storno`);
}