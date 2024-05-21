import AdmZip from "adm-zip";
import { type PackageMetadata } from "./metadata";
import { type UnknownPackageResolver } from "./package";
import { LOG_LEVEL, type Logger } from "../logger";
import { PathScurry, type Path } from "path-scurry";

import TOML from "@ltd/j-toml";

import { Glob } from "glob";
import { link, readFileSync } from "fs";

export interface PackageInstallerConfig {
  /** Where to install packages */
  readonly targetRoot: string;
  /** Where to put headers */
  readonly includePath: string;
  /** Where to put binaries */
  readonly firmwarePath: string;
  /** Where to expand temporary zips */
  readonly tempPath: string;
}

/** Responsible for taking a package zip buffer and placing */
export class PackageInstaller {
  protected readonly pathScurry = new PathScurry(this.config.targetRoot);
  protected readonly tempPath = this.pathScurry.root.resolve(
    this.config.tempPath,
  );

  constructor(
    protected readonly resolvers: UnknownPackageResolver[],
    protected readonly logger: Logger<"package-installer">,
    protected readonly config: PackageInstallerConfig,
  ) {}

  public async install(
    id: string,
    ver: string,
    targetRoot: string,
  ): Promise<void> {
    const packagePath = await this.downloadZip(id, ver);
    if (packagePath == null) {
      this.logger.log(
        LOG_LEVEL.WARNING,
        `Could not find package: ${id}: ${ver}`,
      );
      return;
    }
    const metadata = this.getPackageMetadata(packagePath);
    if (metadata == null) {
      this.logger.log(
        LOG_LEVEL.WARNING,
        `Could not parse package metadata of: ${id}: ${ver}`,
      );
      return;
    }
    const valid = this.validatePackageMetadata(id, metadata);
    if (!valid) {
      this.logger.log(
        LOG_LEVEL.WARNING,
        `Package metadata of ${id}: ${ver} is invalid. The metadata's name is ${metadata.name}`,
      );
      return;
    }

    const { dependencies, peerDependencies, engines } = metadata;
    await Promise.all([
      this.installDependencies(dependencies ?? {}, targetRoot),
      this.installDependencies(peerDependencies ?? {}, targetRoot),
      this.installDependencies(
        (engines as Record<string, string>) ?? {},
        targetRoot,
      ),
      this.applyPackage({ packagePath, metadata, targetRoot }),
    ]);
  }

  protected async applyPackage({
    packagePath,
    metadata,
    targetRoot,
  }: {
    packagePath: Path;
    metadata: PackageMetadata;
    targetRoot: string;
  }): Promise<void> {
    const runtime = metadata.runtime;
    await this.applyFiles(packagePath, [
      ...(runtime?.headers ?? []),
      ...(runtime?.bin ?? []),
      ...(metadata?.files ?? []),
      "package.json",
    ]);
  }

  protected async applyFiles(
    packagePath: Path,
    pathGlobs: string[],
  ): Promise<void> {
    const paths = new Glob(pathGlobs, {
      root: packagePath.fullpath(),
      withFileTypes: true,
    });
    const stream = paths.stream();
    const promises: Array<Promise<unknown>> = [];

    const tempScurry = new PathScurry(this.config.tempPath);

    stream.on("data", (path) => {
      if (path.isDirectory()) return;
      promises.push(
        new Promise((resolve) => {
          link(
            path.fullpath(),
            this.pathScurry.resolve(tempScurry.relative(path.fullpath())),
            resolve,
          );
        }),
      );
    });
    promises.push(
      new Promise<void>((resolve) => {
        stream.on("end", resolve);
      }),
    );

    await Promise.all(promises);
  }

  protected validatePackageMetadata(
    id: string,
    metadata: PackageMetadata,
  ): boolean {
    return metadata.name === id;
  }

  protected async installDependencies(
    dependencies: Record<string, string>,
    targetRoot: string,
  ): Promise<void> {
    await Promise.all(
      Object.entries(dependencies).map(async ([depId, ver]): Promise<void> => {
        await this.install(depId, ver, targetRoot);
      }),
    );
  }

  protected getPackageMetadata(packagePath: Path): PackageMetadata | null {
    const metaPath = packagePath.resolve("LemLink.toml");
    if (!metaPath.isFile()) return null;
    const buf = readFileSync(metaPath.fullpath());
    return JSON.parse(buf.toString());
  }

  protected async downloadZip(
    depId: string,
    ver: string,
  ): Promise<Path | null> {
    for (const resolver of this.resolvers) {
      const buf = await resolver.resolvePackage(depId, ver);
      if (buf == null) continue;
      const zip = new AdmZip(buf);
      const dirPath = this.tempPath.resolve(`${depId}@${ver}`);
      zip.extractAllTo(dirPath.fullpath(), true);
      return dirPath;
    }
    return null;
  }
}
