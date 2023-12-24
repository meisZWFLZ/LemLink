import { type Octokit } from "octokit";
import { Package } from "../package";
import { GithubPackageVersion } from "./version";

export interface GithubPackageIdentifier {
  /**
   * Does not include @ sign
   *
   * @example
   *   Lemlib;
   */
  readonly owner: string;
  /**
   * @example
   *   Lemlink;
   */
  readonly repo: string;
}

export type GithubPackageReleaseData = Awaited<
  ReturnType<Octokit["rest"]["repos"]["listReleases"]>
>["data"][number];

export class GithubPackage extends Package<
  GithubPackageIdentifier,
  GithubPackageVersion
> {
  constructor(
    protected readonly client: Octokit,
    id: GithubPackageIdentifier,
  ) {
    super(id);
  }

  public override async getVersions(): Promise<GithubPackageVersion[]> {
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
}
