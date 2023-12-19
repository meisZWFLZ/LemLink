import {
  GithubPackageResolver,
  type GithubPackageVersion,
} from "./packages/github";
import AdmZip from "adm-zip";
import { Octokit } from "octokit";
import { SemVer } from "semver";

test("download package and check contents", async () => {
  const pack = await new GithubPackageResolver(new Octokit()).resolvePackage({
    owner: "lemlib",
    repo: "lemlib",
  });
  const latest: GithubPackageVersion | undefined = await pack.getVersion(
    new SemVer("0.1.0"),
  );
  expect(latest).toBeDefined();
  if (latest === undefined) throw new Error("latest === undefined");

  const buffer = await latest.download();

  expect(buffer).toBeDefined();
  if (buffer === null) throw new Error("buffer === null");

  const zipFile = new AdmZip(buffer);

  const entries = zipFile.getEntries().map((e) => e.entryName);

  expect(entries).toHaveLength(4);
});
