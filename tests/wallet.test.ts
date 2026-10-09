import { describe, it, expect } from "vitest";
import { validateBtcAddress } from "@/components/WalletGateModal";
import { DEFAULT_BTC_ADDRESS } from "@/lib/constants";

describe("Bitcoin Wallet Address Validation", () => {
  it("should accept valid standard bech32 segwit addresses", () => {
    const result = validateBtcAddress(DEFAULT_BTC_ADDRESS);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should accept legacy 1-prefix addresses of valid length", () => {
    const legacy = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
    const result = validateBtcAddress(legacy);
    expect(result.valid).toBe(true);
  });

  it("should accept script 3-prefix addresses of valid length", () => {
    const p2sh = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
    const result = validateBtcAddress(p2sh);
    expect(result.valid).toBe(true);
  });

  it("should reject empty or whitespace-only addresses", () => {
    const emptyResult = validateBtcAddress("");
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.error).toContain("กรุณาระบุ");

    const spacesResult = validateBtcAddress("   ");
    expect(spacesResult.valid).toBe(false);
  });

  it("should reject addresses that are too short", () => {
    const shortResult = validateBtcAddress("1A1zP1e");
    expect(shortResult.valid).toBe(false);
    expect(shortResult.error).toContain("ความยาว");
  });

  it("should reject addresses with invalid characters such as spaces or symbols", () => {
    const invalidCharsResult = validateBtcAddress("bc1q!invalid#address$char%^&*");
    expect(invalidCharsResult.valid).toBe(false);
    expect(invalidCharsResult.error).toContain("เฉพาะตัวอักษรและตัวเลข");
  });
});
