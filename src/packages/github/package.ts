import { type Octokit } from "octokit";
import { eq as verEquals, type Range, type SemVer } from "semver";
import { GithubPackageVersion } from "./version";

export interface GithubPackageIdentifier {
  /**
   * Does not include @ sign
   *
   * @example
   *   Lemlib;
   *
   * @matches ^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$
   */
  readonly owner: string;
  /**
   * @example
   *   Lemlink;
   *
   * @matches ^[a-z0-9_-\\.]{1,100}$
   */
  readonly repo: string;
}
export type GithubPackageIdentifierString =
  `@${GithubPackageIdentifier["owner"]}/${GithubPackageIdentifier["repo"]}`;

export type GithubPackageReleaseData = Awaited<
  ReturnType<Octokit["rest"]["repos"]["listReleases"]>
>["data"][number];

export class GithubPackage {
  constructor(
    protected readonly client: Octokit,
    public readonly id: GithubPackageIdentifier,
  ) {}

  public async getVersions(): Promise<GithubPackageVersion[]> {
    return (
      await this.client.rest.repos.listReleases({
        ...this.id,
      })
    ).data
      .map((release) =>
        GithubPackageVersion.create(this.client, this.id, release),
      )
      .filter((release): release is GithubPackageVersion => release != null);
  }

  public async getLatest(): Promise<GithubPackageVersion | null> {
    return GithubPackageVersion.create(
      this.client,
      this.id,
      (
        await this.client.rest.repos.getLatestRelease({
          ...this.id,
        })
      ).data,
    );
  }

  /**
   * Retrieves a specific version of this package.
   *
   * @param   version - The version to retrieve.
   *
   * @returns         A promise that resolves to the specified package version,
   *   or undefined if said version is not found.
   */
  public async getVersion(
    version: SemVer,
  ): Promise<GithubPackageVersion | null> {
    return (
      (await this.getVersions()).find((v) => verEquals(v.version, version)) ??
      null
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
  public async getVersionsInRange(
    range: Range,
  ): Promise<GithubPackageVersion[]> {
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
  public async getLatestInRange(
    range: Range,
  ): Promise<GithubPackageVersion | null> {
    return (
      (await this.getVersionsInRange(range))
        .sort((a, b) => a.version.compare(b.version))
        .pop() ?? null
    );
  }
}
