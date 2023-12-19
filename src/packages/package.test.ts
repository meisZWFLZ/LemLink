import { Range, type SemVer, parse as parseVer } from "semver";
import { Package, type PackageIdentifier, PackageVersion } from "./package";

class FakePackageVersion extends PackageVersion {
  public readonly fakeDownload = jest.fn(async () => Buffer.from([]));
  public download: () => Promise<Buffer | undefined> = this.fakeDownload;
}

class FakePackage extends Package<FakePackageVersion, PackageIdentifier> {
  public readonly fakeGetVersions = jest.fn();
  public getVersions: () => Promise<FakePackageVersion[]> =
    this.fakeGetVersions;

  public async getLatest(): Promise<FakePackageVersion | null> {
    return (await this.getLatestInRange(new Range("x.x.x"))) ?? null;
  }
}

function makeSequence(len: number, initial: number = 0): number[] {
  return new Array(len).fill(null).map((_e, i) => i + initial);
}

describe("package version resolution", () => {
  const id = { owner: "test-owner", repo: "test-repo" };
  let pack: FakePackage | undefined;

  beforeAll(() => {
    pack = new FakePackage(id);
    expect(pack.owner).toBe(id.owner);
    expect(pack.repo).toBe(id.repo);

    const semvers: SemVer[] = makeSequence(5)
      .flatMap(
        (maj): Array<[number, number, number]> =>
          makeSequence(5).flatMap(
            (min): Array<[number, number, number]> =>
              makeSequence(5).map((patch): [number, number, number] => [
                maj,
                min,
                patch,
              ]),
          ),
      )
      .map(([maj, min, patch]) => `${maj}.${min}.${patch}`)
      .flatMap((verStr) => [verStr, verStr + "-beta.1"])
      .flatMap((verStr) => [verStr, verStr + "+build.1"])
      .map((verStr) => {
        const ver = parseVer(verStr);
        if (ver == null) throw new Error("semvers must not contain null value");
        return ver;
      });

    const versions: FakePackageVersion[] = semvers.map(
      (semver) => new FakePackageVersion(id, semver),
    );
    pack.fakeGetVersions.mockReturnValue(versions);
  });

  test("getVersionsInRange", async () => {
    expect(pack).toBeDefined();
    const versionsIn1Dot1 = await pack?.getVersionsInRange(new Range("1.1.x"));
    expect(versionsIn1Dot1).toHaveLength(10);

    versionsIn1Dot1
      ?.map((v) => v.version)
      .forEach((ver) => {
        expect(ver.raw).toMatch(/^1\.1\.\d+(?:\+\w+.\d+)?$/);
      });
  });

  test("getVersion", async () => {
    expect(pack).toBeDefined();
    const ver = parseVer("2.3.4");
    if(ver == null) return;
    const version1Dot1Dot1 = await pack?.getVersion(ver);
    expect(version1Dot1Dot1).toBeDefined();
    expect(version1Dot1Dot1?.version.raw).toStrictEqual(ver.raw);
  });

  test("getLatestInRange", async () => {
    expect(pack).toBeDefined();
    const latestIn1Dot1 = await pack?.getLatestInRange(new Range("1.1.x"));
    expect(latestIn1Dot1).toBeDefined();
    expect(latestIn1Dot1?.version.raw).toBe("1.1.4+build.1");
  });
});
