/**
 * Formats a bank account number into groups of 8 digits separated by dashes.
 * e.g. "123456788765432111223344" → "12345678-87654321-11223344"
 *
 * Strips all non-digit characters first, then caps at 24 digits (3 × 8).
 */
export function formatBankAccountNumber(value) {
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, 24);
    return digits.replace(/(\d{8})(?=\d)/g, "$1-");
}
