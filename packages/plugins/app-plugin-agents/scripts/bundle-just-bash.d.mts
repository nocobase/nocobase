/** One package in the bundle, as `THIRD_PARTY_LICENSES.txt` lists it. */
export interface BundledPackage {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly licenseText: string;
  readonly notice: string;
  /** `bundled`, or `inlined in just-bash` for a dependency just-bash's own bundle carries. */
  readonly origin: string;
  readonly dependencies: readonly string[];
}

export declare const EXCLUDED_PACKAGES: readonly string[];

export declare function bundleJustBash(options?: { outdir?: string }): Promise<{
  readonly file: string;
  readonly bytes: number;
  readonly packages: readonly BundledPackage[];
  /** What the bundle imports at run time: Node's built-in modules only. */
  readonly imports: readonly string[];
}>;
