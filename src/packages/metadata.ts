/** Indicates the owner and name of the repo. should be @owner/repo */
export type PackageName = string;
export type Version = string;
/** A person who has been involved in creating or maintaining this package. */
export type Person =
  | {
      name: string;
      url?: string;
      email?: string;
    }
  | string;
/** The contents of a package.json file. */
export interface PackageMetadata {
  name?: PackageName;
  /**
   * Version must be parseable by semver, which is bundled with LemLink as a
   * dependency.
   */
  version?: Version;
  /** This helps people discover your package, as it's listed in 'npm search'. */
  description?: string;
  /** This helps people discover your package as it's listed in 'npm search'. */
  keywords?: string[];
  /** The url to the project homepage. */
  homepage?: string;
  /**
   * The url to your project's issue tracker and / or the email address to which
   * issues should be reported. These are helpful for people who encounter
   * issues with your package.
   */
  bugs?:
    | {
        /** The url to your project's issue tracker. */
        url?: string;
        /** The email address to which issues should be reported. */
        email?: string;
        [k: string]: unknown;
      }
    | string;
  /**
   * You should specify a license for your package so that people know how they
   * are permitted to use it, and any restrictions you're placing on it.
   */
  license?:
    | string
    | (
        | "Apache-2.0"
        | "MIT"
        | "ISC"
        | "BSD-3-Clause"
        | "BSD-2-Clause"
        | "CC0-1.0"
        | "CDDL-1.1"
        | "LGPL-2.1-only"
        | "LGPL-2.1-or-later"
        | "LGPL-3.0-only"
        | "LGPL-3.0-or-later"
        | "EPL-1.0"
        | "EPL-2.0"
        | "MS-PL"
        | "UNLICENSED"
      );
  /**
   * DEPRECATED: Instead, use SPDX expressions, like this: { "license": "ISC" }
   * or { "license": "(MIT OR Apache-2.0)" } see:
   * 'https://docs.npmjs.com/files/package.json#license'.
   */
  licenses?: Array<{
    type?:
      | string
      | (
          | "Apache-2.0"
          | "MIT"
          | "ISC"
          | "BSD-3-Clause"
          | "BSD-2-Clause"
          | "CC0-1.0"
          | "CDDL-1.1"
          | "LGPL-2.1-only"
          | "LGPL-2.1-or-later"
          | "LGPL-3.0-only"
          | "LGPL-3.0-or-later"
          | "EPL-1.0"
          | "EPL-2.0"
          | "MS-PL"
          | "UNLICENSED"
        );
    url?: string;
  }>;
  author?: Person;
  /** A list of people who contributed to this package. */
  contributors?: Person[];
  /** A list of people who maintains this package. */
  maintainers?: Person[];
  /**
   * The 'files' field is an array of files to include in your project. If you
   * name a folder in the array, then it will also include the files inside that
   * folder.
   */
  files?: string[];
  /** Todo */
  type?: "project" | "library" | "template" | "engine";
  /**
   * Specify the place where your code lives. This is helpful for people who
   * want to contribute.
   */
  repository?:
    | {
        type?: string;
        url?: string;
        directory?: string;
      }
    | string;
  /**
   * Dependencies are specified with a simple hash of package name to version
   * range. The version range is a string which has one or more space-separated
   * descriptors. Dependencies can also be identified with a tarball or git
   * URL.
   */
  dependencies?: Record<PackageName, string>;
  /**
   * Dependencies are specified with a simple hash of package name to version
   * range. The version range is a string which has one or more space-separated
   * descriptors. Dependencies can also be identified with a tarball or git
   * URL.
   */
  peerDependencies?: Record<PackageName, string>;
  /**
   * When a user installs your package, warnings are emitted if packages
   * specified in "peerDependencies" are not already installed. The
   * "peerDependenciesMeta" field serves to provide more information on how your
   * peer dependencies are utilized. Most commonly, it allows peer dependencies
   * to be marked as optional. Metadata for this field is specified with a
   * simple hash of the package name to a metadata object.
   */
  peerDependenciesMeta?: Record<
    PackageName,
    {
      /**
       * Specifies that this peer dependency is optional and should not be
       * installed automatically.
       */
      optional?: boolean;
    }
  >;
  /**
   * Overrides is used to support selective version overrides using npm, which
   * lets you define custom package versions or ranges inside your
   * dependencies.
   */
  overrides?: Record<PackageName, unknown>;
  engines?: {
    pros?: string;
    [k: PackageName]: string | undefined;
  };
  /** If set to true, then npm will refuse to publish it. */
  private?: boolean;
  runtime?: {
    bin?: string[];
    headers?: string[];
  };
  vex?: {
    ports?: Record<string, unknown>;
    program?: {
      slot?: number;
      icon?: string;
    };
  };
}
