import { eq as verEquals, type Range, type SemVer } from "semver";

/**
 * Represents a package version.
 *
 * @template ID - The type of the package ID.
 */
export abstract class PackageVersion<ID> {
  /**
   * Represents a package.
   *
   * @param id      - The ID of the package.
   * @param version - The version of the package.
   */
  public constructor(
    public readonly id: ID,
    public readonly version: SemVer,
  ) {}

  /**
   * @returns A promise that resolves to a Buffer containing the downloaded
   *   package, or undefined if the download fails.
   */
  public abstract download(): Promise<Buffer | undefined>;
}

/**
 * Represents an package. Packages can be templates, libraries, and engines.
 * This provides methods to retrieve {@linkcode PackageVersion versions} of this
 * package.
 *
 * @template V - The type of package version.
 * @template ID - How different packages should be identified.
 *
 * @see {PackageVersion}
 * @see {PackageResolver}
 */
export abstract class Package<ID, V extends PackageVersion<ID>> {
  constructor(public readonly id: ID) {}

  /**
   * Retrieves all versions of this package.
   *
   * @returns A promise that resolves to an array of {}.
   */
  public abstract getVersions(): Promise<V[]>;

  /**
   * Retrieves the latest version of this package.
   *
   * @returns A promise that resolves to the latest package version, or null if
   *   no versions are available.
   */
  public abstract getLatest(): Promise<V | null>;

  /**
   * Retrieves a specific version of this package.
   *
   * @param   version - The version to retrieve.
   *
   * @returns         A promise that resolves to the specified package version,
   *   or undefined if said version is not found.
   */
  public async getVersion(version: SemVer): Promise<V | undefined> {
    return (await this.getVersions()).find((v) =>
      verEquals(v.version, version),
    );
  }

  /**
   * Retrieves all versions of the package within a specified range.
   *
   * @param   range - The range of versions to retrieve.
   *
   * @returns       A promise that resolves to an array of package versions
   *   within the specified range.
   */
  public async getVersionsInRange(range: Range): Promise<V[]> {
    const versions = await this.getVersions();
    return versions.filter((v) => range.test(v.version));
  }

  /**
   * Retrieves the latest version of the package within a specified range.
   *
   * @param   range - The range of versions to consider.
   *
   * @returns       A promise that resolves to the latest package version within
   *   the specified range, or undefined if no versions are available in the
   *   range.
   */
  public async getLatestInRange(range: Range): Promise<V | undefined> {
    return (await this.getVersionsInRange(range))
      .sort((a, b) => a.version.compare(b.version))
      .pop();
  }
}

/**
 * Represents a way to resolve a {@linkcode Package}. For example,
 * {@linkcode GithubPackageResolver} resolves packages by retrieving them from
 * GitHub. In the future, users should be able to retrieve packages from local
 * packages.
 *
 * @see {Package}
 * @see {PackageResolver.resolvePackage}
 * @see {GithubPackageResolver}
 */
export abstract class PackageResolver<
  ID,
  P extends Package<ID, PackageVersion<ID>>,
> {
  /**
   * Resolves a {@linkcode Package} from an
   * {@linkcode PackageIdentifier identifier}.
   *
   * @param   id - Identifies the desired {@linkcode Package}
   *
   * @returns    The package indicated by {@linkcode id} or null if it does not
   *   exist
   *
   * @see {Package}
   * @see {PackageIdentifier}
   * @see {PackageResolver}
   */
  public abstract resolvePackage(id: ID): Promise<P | null>;
}
