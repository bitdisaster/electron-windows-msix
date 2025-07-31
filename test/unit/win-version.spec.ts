import { expect, describe, it } from 'vitest'
import { WindowsVersion } from '../../src/win-version';

describe('win-version', () => {
  it('should parse version string correctly', () => {
    const version = new WindowsVersion('10.0.17763.0');
    expect(version.major).toBe(10);
    expect(version.minor).toBe(0);
    expect(version.patch).toBe(17763);
    expect(version.build).toBe(0);
  });

  it('should throw an error if the version string is invalid', () => {
    expect(() => new WindowsVersion('10.0.17763')).toThrow();
  });

  it('should throw an error if the version string is invalid', () => {
    expect(() => new WindowsVersion('10.0.17763.0.1')).toThrow();
  });

  it('should detect equal versions correctly', () => {
    const version1 = new WindowsVersion('10.0.17763.0');
    const version2 = new WindowsVersion('10.0.17763.0');
    expect(version1.equals(version2)).toBe(0);
  });

  it('should detect older versions correctly', () => {
    const version1 = new WindowsVersion('10.0.17763.0');
    const version2 = new WindowsVersion('10.0.17763.1');
    expect(version1.equals(version2)).toBe(-1);
  });

  it('should detect newer versions correctly', () => {
    const version1 = new WindowsVersion('10.0.17763.1');
    const version2 = new WindowsVersion('10.0.17763.0');
    expect(version1.equals(version2)).toBe(1);
  });

  it('should detect equal versions correctly', () => {
    expect(WindowsVersion.IsSame('10.0.17763.0', '10.0.17763.0')).toBe(true);
  });

  it('should detect different major versions correctly', () => {
    expect(WindowsVersion.IsSame('10.0.17763.0', '11.0.17763.0')).toBe(false);
    expect(WindowsVersion.IsSame('11.0.17763.0', '10.0.17763.0')).toBe(false);
  });

  it('should detect different minor versions correctly', () => {
    expect(WindowsVersion.IsSame('10.0.17763.0', '10.1.17763.0')).toBe(false);
    expect(WindowsVersion.IsSame('10.1.17763.0', '10.0.17763.0')).toBe(false);
  });

  it('should detect different patch versions correctly', () => {
    expect(WindowsVersion.IsSame('10.0.17763.0', '10.0.17764.0')).toBe(false);
    expect(WindowsVersion.IsSame('10.0.17764.0', '10.0.17763.0')).toBe(false);
  });

  it('should detect different build versions correctly', () => {
    expect(WindowsVersion.IsSame('10.0.17763.0', '10.0.17763.1')).toBe(false);
    expect(WindowsVersion.IsSame('10.0.17763.1', '10.0.17763.0')).toBe(false);
  });

  it('should detect older versions correctly', () => {
    expect(WindowsVersion.IsOlder('10.0.17763.0', '10.0.17763.1')).toBe(true);
  });

  it('should detect none older versions correctly', () => {
    expect(WindowsVersion.IsOlder('10.0.17763.1', '10.0.17763.0')).toBe(false);
    expect(WindowsVersion.IsOlder('10.0.17763.0', '10.0.17763.0')).toBe(false);
  });

  it('should detect newer versions correctly', () => {
    expect(WindowsVersion.IsNewer('10.0.17763.1', '10.0.17763.0')).toBe(true);
  });

  it('should detect none newer versions correctly', () => {
    expect(WindowsVersion.IsNewer('10.0.17763.0', '10.0.17763.1')).toBe(false);
    expect(WindowsVersion.IsNewer('10.0.17763.0', '10.0.17763.0')).toBe(false);
  });

  it('should serialize version correctly', () => {
    const version = new WindowsVersion('10.0.17763.0');
    expect(version.toString()).toBe('10.0.17763.0');
  });
});
