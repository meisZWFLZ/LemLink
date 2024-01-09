import AdmZip from "adm-zip";
import { type PackageMetadata } from "./metadata";
import { type UnknownPackageResolver } from "./package";
import { LOG_LEVEL, type Logger } from "../logger";

/** Responsible for taking a package zip buffer and placing */
export class PackageInstaller {
  constructor(
    protected readonly resolvers: UnknownPackageResolver[],
    protected readonly logger: Logger<"package-installer">,
  ) {}

  public async install(
    id: string,
    ver: string,
    targetRoot: string,
  ): Promise<void> {
    const zip = await this.downloadZip(id, ver);
    if (zip == null) {
      this.logger.log(
        LOG_LEVEL.WARNING,
        `Could not find package: ${id}: ${ver}`,
      );
      return;
    }
    const metadata = this.getPackageMetadata(zip);
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
      this.applyPackage({ zip, metadata, targetRoot }),
    ]);
  }

  protected async applyPackage({
    zip,
    metadata,
    targetRoot,
  }: {
    zip: AdmZip;
    metadata: PackageMetadata;
    targetRoot: string;
  }): Promise<void> {
    const runtime = metadata.runtime;
    await Promise.all([
      ...(runtime?.bin?.map(async (binPath) => {
        await this.applyFiles(zip, binPath, targetRoot);
      }) ?? []),
      ...(runtime?.headers?.map(async (headerPath) => {
        await this.applyFiles(zip, headerPath, targetRoot);
      }) ?? []),
      ...(metadata?.files?.map(async (filePath) => {
        await this.applyFiles(zip, filePath, targetRoot);
      }) ?? []),
      this.applyFiles(zip, "package.json", targetRoot),
    ]);
  }

  protected async globify(zip: AdmZip, pathToFiles: string): Promise<string[]> {
    throw new Error("Not implemented");
  }

  protected async applyFiles(
    zip: AdmZip,
    pathToFiles: string,
    targetPath: string,
  ): Promise<void> {
    const paths = await this.globify(zip, pathToFiles);
    await Promise.all(
      paths.map(async (path) => {
        zip.extractEntryTo(path, targetPath + path, false, true);
      }),
    );
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

  protected getPackageMetadata(zip: AdmZip): PackageMetadata | null {
    const entry = zip.getEntry("package.json");
    if (entry == null) return null;
    const buf = zip.readAsText(entry);
    if (buf == null) return null;
    return JSON.parse(buf);
  }

  protected async downloadZip(
    depId: string,
    ver: string,
  ): Promise<AdmZip | null> {
    for (const resolver of this.resolvers) {
      const buf = await resolver.resolvePackage(depId, ver);
      if (buf == null) continue;
      return new AdmZip(buf);
    }
    return null;
  }
}
