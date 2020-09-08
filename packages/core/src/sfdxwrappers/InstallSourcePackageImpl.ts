import ManifestHelpers from "../sfdxutils/ManifestHelpers";
import { isNullOrUndefined } from "util";
import PackageMetadata from "../sfdxwrappers/PackageMetadata";
import DeployDestructiveManifestToOrgImpl from "./DeployDestructiveManifestToOrgImpl";
import DeploySourceToOrgImpl, {
  DeploySourceResult,
} from "./DeploySourceToOrgImpl";
const path = require("path");

export class InstallSourcePackageImpl {
  public constructor(
    private sfdx_package: string,
    private sourceDirectoryPath: string,
    private subdirectory: string,
    private target_org: string,
    private upgrade_type: string,
    private wait_time: string,
    private packageMetadata: PackageMetadata
  ) {}

  public async exec() {
    let sourceDirectory;
    if (!isNullOrUndefined(this.sfdx_package)) {
      sourceDirectory = ManifestHelpers.getSFDXPackageDescriptor(
        this.sourceDirectoryPath,
        this.sfdx_package
      )["path"];
    } else {
      console.log(
        "##[warning] No Package name passed in the input parameter, Utilizing the default package in the manifest"
      );
      sourceDirectory = ManifestHelpers.getDefaultSFDXPackageDescriptor(
        this.sourceDirectoryPath
      )["path"];
    }

    console.log("Path for the project", sourceDirectory);
    if (!isNullOrUndefined(this.subdirectory)) {
      sourceDirectory = path.join(sourceDirectory, this.subdirectory);
    }

    // Apply Destructive Manifest
    if (
      this.upgrade_type == "ApplyDestructiveChanges" &&
      this.packageMetadata.isDestructiveChangesFound
    ) {
      try {
        console.log(
          "Attempt to delete components mentioned in destructive manifest"
        );
        let deployDestructiveManifestToOrg = new DeployDestructiveManifestToOrgImpl(
          this.target_org,
          path.join(
            this.sourceDirectoryPath,
            "destructive",
            "destructiveChanges.xml"
          )
        );

        deployDestructiveManifestToOrg.exec();
      } catch (error) {
        console.log(
          "##[warning] We attempted a deletion of components, However were are not succesfull. Either the components are already deleted or there are components which have dependency to components in the manifest, Please check whether this manifest works!"
        );
      }
    }
    //Apply Reconcile if Profiles are found

    //Construct Deploy Command
    let deploymentOptions = await this.generateDeploymentOptions(
      this.wait_time,
      this.packageMetadata.apextestsuite,
      this.target_org
    );
    let deploySourceToOrgImpl: DeploySourceToOrgImpl = new DeploySourceToOrgImpl(
      this.target_org,
      this.sourceDirectoryPath,
      sourceDirectory,
      deploymentOptions,
      false
    );

    let result: DeploySourceResult = await deploySourceToOrgImpl.exec();
    return result;
  }

  private async generateDeploymentOptions(
    wait_time: string,
    apextextsuite: string,
    target_org: string
  ): Promise<any> {
    let mdapi_options = {};
    mdapi_options["ignore_warnings"] = true;
    mdapi_options["wait_time"] = wait_time;

    if (!isNullOrUndefined(apextextsuite)) {
      mdapi_options["testlevel"] = "RunApexTestSuite";
      mdapi_options["apextestsuite"] = apextextsuite;
    } else {
      //Determine test option
      try {
        let result = await OrgDetails.getOrgDetails(target_org);
        if (result["IsSandbox"]) {
          //Its a sandbox org, and no apex test suite skip tests
          mdapi_options["testlevel"] = "NoTestRun"; //Just ignore tests
          mdapi_options["specified_tests"] = "skip";
        } else {
          mdapi_options["testlevel"] = "RunSpecifiedTests"; //Just ignore tests
          mdapi_options["specified_tests"] = "skip";
        }
      } catch (error) {
        console.log(
          "Unable to fetch Org Details, Proceeding as if its Production Org"
        );
        mdapi_options["testlevel"] = "RunSpecifiedTests";
        mdapi_options["specified_tests"] = "skip"; //Just ignore tests
      }
    }
    return mdapi_options;
  }
}
