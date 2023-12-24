import { type Octokit } from "octokit";
import { PackageVersion } from "../package";
import { type SemVer, parse } from "semver";
import {
  type GithubPackageIdentifier,
  type GithubPackageReleaseData,
} from "./package";

export class GithubPackageVersion extends PackageVersion<GithubPackageIdentifier> {
  protected constructor(
    protected readonly client: Octokit,
    packId: GithubPackageIdentifier,
    public readonly data: GithubPackageReleaseData,
    version: SemVer,
  ) {
    super(packId, version);
  }

  public static create(
    client: Octokit,
    packId: GithubPackageIdentifier,
    data: GithubPackageReleaseData,
  ): GithubPackageVersion | null {
    const version = parse(data.tag_name);
    if (version == null) return null;
    return new GithubPackageVersion(client, packId, data, version);
  }

  protected getAssetIndex(): number {
    return 0;
  }

  public override async download(): Promise<Buffer | undefined> {
    const index = this.getAssetIndex();

    const res = await this.client.rest.repos.getReleaseAsset({
      repo: this.id.repo,
      owner: this.id.owner,
      asset_id: this.data.assets[index].id,
      headers: { accept: "application/octet-stream" },
    });

    const data = res.data;

    if (data instanceof ArrayBuffer) {
      return Buffer.from(data);
    }
    throw new Error(
      "github api response was not Array. res status: " + res.status,
    );
  }
}
