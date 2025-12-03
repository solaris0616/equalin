/**
 * Converts a decimal amount to integer cents for storage.
 * Uses banker's rounding (round half to even) for amounts with more than 2 decimal places.
 *
 * @param amount - The decimal amount (e.g., 100.50)
 * @returns The amount in cents (e.g., 10050)
 *
 * @example
 * amountToInteger(100.50) // returns 10050
 * amountToInteger(0) // returns 0
 * amountToInteger(999999999.99) // returns 99999999999
 */
export function amountToInteger(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts integer cents to a decimal string for display.
 * Always formats with exactly 2 decimal places.
 *
 * @param cents - The amount in cents (e.g., 10050)
 * @returns The formatted decimal string (e.g., "100.50")
 *
 * @example
 * integerToAmount(10050) // returns "100.50"
 * integerToAmount(0) // returns "0.00"
 * integerToAmount(100) // returns "1.00"
 */
export function integerToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Validates that an amount is within acceptable range.
 * Amount must be positive and not exceed 999,999,999.99.
 *
 * @param amount - The decimal amount to validate
 * @returns true if the amount is valid, false otherwise
 *
 * @example
 * isValidAmount(100.50) // returns true
 * isValidAmount(0) // returns false (must be positive)
 * isValidAmount(-10) // returns false (must be positive)
 * isValidAmount(1000000000) // returns false (exceeds maximum)
 */
export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount <= 999999999.99;
}
