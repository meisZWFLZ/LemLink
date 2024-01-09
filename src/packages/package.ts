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
export abstract class PackageResolver<ID extends string, V extends string> {
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
  public abstract resolvePackage(id: ID, ver: V): Promise<Buffer | null>;
}

export type UnknownPackageResolver = PackageResolver<string, string>;
