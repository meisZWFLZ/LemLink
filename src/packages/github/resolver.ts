import { type Octokit } from "octokit";
import { PackageResolver } from "../package";
import { GithubPackage, type GithubPackageIdentifier } from "./package";

export class GithubPackageResolver extends PackageResolver<
  GithubPackageIdentifier,
  GithubPackage
> {
  public constructor(protected readonly client: Octokit) {
    super();
  }

  public override async resolvePackage(
    id: GithubPackageIdentifier,
  ): Promise<GithubPackage> {
    return new GithubPackage(this.client, id);
  }
}
