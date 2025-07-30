import { describe, it, expect } from "vitest";
import path from "path";
import { packageMSIX } from "../../src";

describe('package', () => {
  it('should package an app', async () => {
    const result = packageMSIX({
      appDir: path.join(__dirname, 'fixtures', 'app-x64'),
      outputDir: path.join(__dirname, '..', '..', 'output'),
      appManifest: path.join(__dirname, 'fixtures', 'AppxManifest_x64.xml'),
    });
    await result;q

  });
});