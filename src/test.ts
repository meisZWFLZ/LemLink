// import { pathToFileURL } from "node:url";
import { BaseSink, ExternalLogger, LogMessage, Logger } from "./logger";
import { PackageInstaller } from "./packages/installer";
import { GithubPackageResolver } from "./packages/github/resolver";
import { Octokit } from "octokit";
void (async () => {
  // const { resolve } = await import("import-meta-resolve");
  // const url = pathToFileURL(process.cwd() + "/.").href;
  // console.log(url);
  // console.log(resolve("@ltd/j-toml", url));
  const installer = new PackageInstaller(
    [new GithubPackageResolver(new Octokit())],
    new Logger("package-installer"),
    {
      targetRoot: process.cwd(),
      tempPath: process.cwd() + "/tmp",
      includePath: "include",
      firmwarePath: "firmware",
    },
  );
  await installer.install("@lemlib/lemlib", "0.5.0", "target");
})();
class ConsoleSink extends BaseSink<LogMessage<string>>{
  // constructor() {
  //   super();
  // }

  log(msg: LogMessage<string>): void {
    console.log(msg);
  }
}
ExternalLogger.addSink(new ConsoleSink());
