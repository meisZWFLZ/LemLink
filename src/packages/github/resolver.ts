import { type Octokit } from "octokit";
import { PackageResolver } from "../package";
import {
  GithubPackage,
  type GithubPackageIdentifierString,
  type GithubPackageIdentifier,
} from "./package";
import { Range } from "semver";

export class GithubPackageResolver extends PackageResolver<
  GithubPackageIdentifierString,
  string
> {
  public idPattern: RegExp =
    /^@(?<owner>[a-z0-9]([a-z0-9]|-(?=[a-z0-9])){0,38})\/(?<repo>([a-z0-9_\-.]){1,100})$/;

  public constructor(protected readonly client: Octokit) {
    super();
  }

  public convertId(
    idString: GithubPackageIdentifierString,
  ): GithubPackageIdentifier | null {
    const matchGroups = idString.match(this.idPattern)?.groups;
    const owner = matchGroups?.owner;
    const repo = matchGroups?.repo;
    if (owner == null || repo == null) return null;
    return { owner, repo };
  }

  public override async resolvePackage(
    id: GithubPackageIdentifierString,
    ver: string,
  ): Promise<Buffer | null> {
    const convertedId = this.convertId(id);
    if (convertedId == null) return null;
    const pack = new GithubPackage(this.client, convertedId);
    const semverRange = new Range(ver);
    const version = await pack.getLatestInRange(semverRange);
    return (await version?.download()) ?? null;
  }
}
