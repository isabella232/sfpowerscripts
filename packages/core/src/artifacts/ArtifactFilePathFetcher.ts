import path = require("path");
import fs = require("fs");
import SFPLogger from "../utils/SFPLogger";
const glob = require("glob");
import AdmZip = require('adm-zip');

export default class ArtifactFilePathFetcher {
  /**
   * Decider for which artifact retrieval method to use
   *
   * @param artifactDirectory
   * @param sfdx_package
   */
  public static fetchArtifactFilePaths(
    artifactDirectory: string,
    sfdx_package?: string
  ): ArtifactFilePaths[] {

    if (!fs.existsSync(artifactDirectory)) {
      throw new Error(`Artifact directory ${path.resolve(artifactDirectory)} does not exist`);
    }

    let artifacts_filepaths = ArtifactFilePathFetcher.fetchArtifactFilePathsFromArtifactDirectory(
      artifactDirectory,
      sfdx_package
    );

    return artifacts_filepaths;
  }

  /**
   * Helper method for retrieving the ArtifactFilePaths of a pipeline artifact
   * @param sfdx_package
   */
  private static fetchArtifactFilePathsFromArtifactDirectory(
    artifactDirectory: string,
    sfdx_package: string
  ): ArtifactFilePaths[] {
    const artifacts_filepaths: ArtifactFilePaths[] = [];

    // Decompress artifacts
    let zipArtifactFilepaths: string[] = glob.sync(
      `**/*_sfpowerscripts_artifact_*.zip`,
      {
        cwd: artifactDirectory,
        absolute: true,
      }
    );

    if (zipArtifactFilepaths.length > 0) {
      for (let zipArtifactFilepath of zipArtifactFilepaths) {
        let zip = new AdmZip(zipArtifactFilepath);
        zip.extractAllTo(artifactDirectory, true);
      }
    }

    // Search entire pipeline workspace for files matching artifact_metadata.json
    let packageMetadataFilepaths: string[] = glob.sync(
      `**/artifact_metadata.json`,
      {
        cwd: artifactDirectory,
        absolute: true,
      }
    );

    if (sfdx_package) {
      // Filter and only return ArtifactFilePaths for sfdx_package
      packageMetadataFilepaths = packageMetadataFilepaths.filter((filepath) => {
        let artifactMetadata = JSON.parse(fs.readFileSync(filepath, "utf8"));
        return artifactMetadata["package_name"] === sfdx_package;
      });
    }

    SFPLogger.log("Package Metadata File Paths",JSON.stringify(packageMetadataFilepaths));

    for (let packageMetadataFilepath of packageMetadataFilepaths) {
      let sourceDirectory = path.join(
        path.dirname(packageMetadataFilepath),
        `source`
      );

      let changelogFilepath = path.join(
        path.dirname(packageMetadataFilepath),
        `changelog.json`
      );

      artifacts_filepaths.push({
        packageMetadataFilePath: packageMetadataFilepath,
        sourceDirectoryPath: sourceDirectory,
        changelogFilePath: changelogFilepath,
      });
    }

    SFPLogger.log("Artifact File Paths",JSON.stringify(artifacts_filepaths));

    return artifacts_filepaths;
  }

  /**
   * Decider for task outcome if the artifact cannot be found
   * @param artifacts_filepaths
   * @param isToSkipOnMissingArtifact
   */
  public static missingArtifactDecider(
    artifacts_filepaths: ArtifactFilePaths[],
    isToSkipOnMissingArtifact: boolean
  ): boolean {
    if (artifacts_filepaths.length === 0 && !isToSkipOnMissingArtifact) {
      throw new Error(
        `Artifact not found, Please check the inputs`
      );
    } else if (
      artifacts_filepaths.length === 0 &&
      isToSkipOnMissingArtifact
    ) {
      SFPLogger.log(
        `Skipping task as artifact is missing, and 'Skip If no artifact is found' ${isToSkipOnMissingArtifact}`
      );
      return true;
    }
  }
}

export interface ArtifactFilePaths {
  packageMetadataFilePath: string;
  sourceDirectoryPath?: string;
  changelogFilePath?: string;
}
