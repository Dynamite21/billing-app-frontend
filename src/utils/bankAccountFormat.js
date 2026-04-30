

export function formatBankAccountNumber(value) {
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, 24);
    return digits.replace(/(\d{8})(?=\d)/g, "$1-");
}
