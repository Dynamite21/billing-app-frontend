export function calcLineNet(item) {
    return Math.round(item.amount * item.productAmount);
}

export function calcLineVat(item) {
    return Math.round(calcLineNet(item) * item.taxRate / 100);
}

export function calcLineGross(item) {
    return calcLineNet(item) + calcLineVat(item);
}

export function calcInvoiceNet(inv) {
    return inv.items?.reduce((sum, item) => sum + calcLineNet(item), 0) ?? 0;
}

export function calcInvoiceGross(inv) {
    return inv.items?.reduce((sum, item) => sum + calcLineGross(item), 0) ?? 0;
}

function isInMonth(inv, year, month) {
    if (!inv.date) return false;
    const d = new Date(inv.date);
    return d.getFullYear() === year && d.getMonth() === month;
}

function monthNormal(invoices, year, month) {
    return invoices.filter((inv) => !inv.storno && isInMonth(inv, year, month));
}

function monthStorno(invoices, year, month) {
    return invoices.filter((inv) => inv.storno && isInMonth(inv, year, month));
}

export function calcMonthlyGross(invoices, year, month) {
    return monthNormal(invoices, year, month).reduce((sum, inv) => sum + calcInvoiceGross(inv), 0);
}

export function calcMonthlyCount(invoices, year, month) {
    return monthNormal(invoices, year, month).length;
}

export function calcMonthlyAverage(invoices, year, month) {
    const count = calcMonthlyCount(invoices, year, month);
    return count > 0 ? calcMonthlyGross(invoices, year, month) / count : 0;
}

export function getNearDueInvoices(invoices) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 3);

    return invoices
        .filter((inv) => {
            if (inv.storno || !inv.dueDate) return false;
            const due = new Date(inv.dueDate);
            due.setHours(0, 0, 0, 0);
            return due >= today && due <= cutoff;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

export function calcTopPartners(invoices, year, month, n = 3) {
    const totals = {};
    monthNormal(invoices, year, month).forEach((inv) => {
        const name = inv.partnerData?.name || "Ismeretlen";
        totals[name] = (totals[name] ?? 0) + calcInvoiceGross(inv);
    });

    return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([name, gross]) => ({ name, gross }));
}

export function calcPaymentMethodDist(invoices, year, month) {
    const dist = {};
    monthNormal(invoices, year, month).forEach((inv) => {
        const method = inv.paymentMethod || "UNKNOWN";
        dist[method] = (dist[method] ?? 0) + 1;
    });

    return Object.entries(dist)
        .sort((a, b) => b[1] - a[1])
        .map(([method, count]) => ({ method, count }));
}

export function calcStornoStats(invoices, year, month) {
    const stornos = monthStorno(invoices, year, month);
    return {
        count: stornos.length / 2,
        gross: stornos.reduce((sum, inv) => sum + Math.abs(calcInvoiceGross(inv)), 0) / 2,
    };
}

export function getEarliestMonth(invoices) {
    let earliest = null;
    invoices.forEach((inv) => {
        if (!inv.date) return;
        const d = new Date(inv.date);
        if (!earliest || d < earliest) earliest = d;
    });
    if (!earliest) return null;
    return { year: earliest.getFullYear(), month: earliest.getMonth() };
}
