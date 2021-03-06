import SfpowerscriptsCommand from "./SfpowerscriptsCommand";
import { Messages } from "@salesforce/core";
import { flags } from "@salesforce/command";
import ArtifactFilePathFetcher from "@dxatscale/sfpowerscripts.core/lib/artifacts/ArtifactFilePathFetcher";

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@dxatscale/sfpowerscripts', 'install_package_command');

/**
 * Base class providing common functionality for package installation
 *
 * @extends SfpowerscriptsCommand
 */
export default abstract class InstallPackageCommand extends SfpowerscriptsCommand {

  /**
   * Flags that are common/required on all package installation commands
   */
  protected static flagsConfig = {
    package: flags.string({char: 'n', description: messages.getMessage('packageFlagDescription'), required: true}),
    targetorg: flags.string({char: 'u', description: messages.getMessage('targetOrgFlagDescription'), required: true}),
    artifactdir: flags.directory({description: messages.getMessage('artifactDirectoryFlagDescription'), default: 'artifacts'}),
    skiponmissingartifact: flags.boolean({char: 's', description: messages.getMessage('skipOnMissingArtifactFlagDescription')})
  };

  /**
   * Procedures unique to the type of package installation
   */
  abstract install(): Promise<any>;

  /**
   * Entry point for package installation commands
   *
   */
  async execute(): Promise<any> {
    this.preInstall();

    await this.install();

    this.postInstall();
  }

  /**
   * Procedures common to all install commands, and to be run BEFORE
   * the primary install
   */
  private preInstall(): void {

    ArtifactFilePathFetcher.fetchArtifactFilePaths(
      this.flags.artifactdir,
      this.flags.package
    );

  }

  /**
   * Procedures common to all install commands, and to be run AFTER
   * the primary install
   */
  private postInstall(): void {

  }
}
