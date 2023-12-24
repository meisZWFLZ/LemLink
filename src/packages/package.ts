import { eq as verEquals, type Range, type SemVer } from "semver";

export abstract class PackageVersion<ID> {
  public constructor(
    public readonly id: ID,
    public readonly version: SemVer,
  ) {}
  public abstract download(): Promise<Buffer | undefined>;
}

export abstract class Package<ID, V extends PackageVersion<ID>> {
  constructor(public readonly id: ID) {}

  public abstract getVersions(): Promise<V[]>;
  public abstract getLatest(): Promise<V | null>;

  public async getVersion(version: SemVer): Promise<V | undefined> {
    return (await this.getVersions()).find((v) =>
      verEquals(v.version, version),
    );
  }

  public async getVersionsInRange(range: Range): Promise<V[]> {
    const versions = await this.getVersions();
    return versions.filter((v) => range.test(v.version));
  }

  public async getLatestInRange(range: Range): Promise<V | undefined> {
    return (await this.getVersionsInRange(range))
      .sort((a, b) => a.version.compare(b.version))
      .pop();
  }
}

export abstract class PackageResolver<
  ID,
  P extends Package<ID, PackageVersion<ID>>,
> {
  public abstract resolvePackage(id: ID): Promise<P | null>;
}
