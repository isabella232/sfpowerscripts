import PackageMetadata from "../PackageMetadata";
import SourcePackageGenerator from "../generators/SourcePackageGenerator";
import ManifestHelpers from "../manifest/ManifestHelpers";
import MDAPIPackageGenerator from "../generators/MDAPIPackageGenerator";
import { isNullOrUndefined } from "util";
const fs = require("fs-extra");
const xmlParser = require("xml2js").Parser({ explicitArray: false });

export default class CreateSourcePackageImpl {
  public constructor(
    private projectDirectory: string,
    private sfdx_package: string,
    private destructiveManifestFilePath: string,
    private packageArtifactMetadata: PackageMetadata
  ) {}

  public async exec(): Promise<PackageMetadata> {
    this.packageArtifactMetadata.package_type = "source";
    console.log(
      "--------------Create Source Package---------------------------"
    );
    console.log("Project Directory", this.projectDirectory);
    console.log("sfdx_package", this.sfdx_package);
    console.log(
      "destructiveManifestFilePath",
      this.destructiveManifestFilePath
    );
    console.log("packageArtifactMetadata", this.packageArtifactMetadata);

    let startTime = Date.now();

    //Get Package Descriptor
    let packageDescriptor,packageDirectory:string;
    if(!isNullOrUndefined(this.sfdx_package))
    {
     packageDescriptor = ManifestHelpers.getSFDXPackageDescriptor(
      this.projectDirectory,
      this.sfdx_package
    );
    packageDirectory = packageDescriptor["path"];
    this.packageArtifactMetadata.preDeploymentSteps=packageDescriptor["preDeploymentSteps"]?.split("&&");
    this.packageArtifactMetadata.postDeploymentSteps=packageDescriptor["postDeploymentSteps"]?.split("&&");
    }




    //Generate Destructive Manifest
    let destructiveChanges: DestructiveChanges =  await this.getDestructiveChanges(
      packageDescriptor,
      this.destructiveManifestFilePath
    );
    if(!isNullOrUndefined(destructiveChanges))
    {
    this.packageArtifactMetadata.isDestructiveChangesFound =
      destructiveChanges.isDestructiveChangesFound;
    this.packageArtifactMetadata.destructiveChanges =
      destructiveChanges.destructiveChanges;
    }

    //Convert to MDAPI to get PayLoad
    let mdapiPackage;
    if (!isNullOrUndefined(packageDirectory)) {
      //Check whether forceignores will result in empty directory
      let isEmpty: boolean = MDAPIPackageGenerator.isEmptyFolder(
        this.projectDirectory,
        packageDirectory
      );

      if (!isEmpty) {
        mdapiPackage = await MDAPIPackageGenerator.getMDAPIPackageFromSourceDirectory(
          this.projectDirectory,
          packageDirectory
        );

        this.packageArtifactMetadata.payload = mdapiPackage.manifest;
        this.packageArtifactMetadata.isApexFound = ManifestHelpers.checkApexInPayload(mdapiPackage.manifest);
        this.packageArtifactMetadata.isProfilesFound = ManifestHelpers.checkProfilesinPayload(mdapiPackage.manifest);

      } else {
        console.log(
          "---------------------WARNING! Empty aritfact encountered-------------------------------"
        );
        console.log(
          "Either this folder is empty or the application of .forceignore results in an empty folder"
        );
        console.log("Proceeding to create an empty artifact");
        console.log(
          "---------------------------------------------------------------------------------------"
        );
      }
    } else {
      console.log(
        "Proceeding with all packages.. as a particular package was not provided"
      );
    }

    //Get Artifact Detailes
    let sourcePackageArtifactDir = SourcePackageGenerator.generateSourcePackageArtifact(
      this.projectDirectory,
      this.sfdx_package,
      packageDirectory,
      isNullOrUndefined(destructiveChanges)?undefined:destructiveChanges.destructiveChangesPath
    );

    this.packageArtifactMetadata.sourceDir = sourcePackageArtifactDir;

    //Add Timestamps
    let endTime = Date.now();
    let elapsedTime = endTime - startTime;
    this.packageArtifactMetadata.creation_details = {
      creation_time: elapsedTime,
      timestamp: Date.now(),
    };
    return this.packageArtifactMetadata;
  }

  private async getDestructiveChanges(
    packageDescriptor: any,
    destructiveManifestFilePath: string
  ): Promise<DestructiveChanges> {
    let destructiveChanges: any;
    let isDestructiveChangesFound: boolean = false;
    let destructiveChangesPath: string;

    if (packageDescriptor === null || packageDescriptor === undefined) {
      return undefined;
    }

    //Precedence to Value Passed in Flags
    if (!isNullOrUndefined(destructiveManifestFilePath)) {
      destructiveChangesPath = destructiveManifestFilePath;
    } else {
      if (packageDescriptor["destructiveChangePath"]) {
        destructiveChangesPath = packageDescriptor["destructiveChangePath"];
      }
    }

    try {
      
      if (!isNullOrUndefined(destructiveChangesPath)) {
        console.log("Reading destructive changes from ",destructiveChangesPath);


        
        let destructiveChangesXML: string = fs.readFileSync(destructiveChangesPath, "utf8")
        destructiveChanges = await CreateSourcePackageImpl.xml2json(destructiveChangesXML);
        isDestructiveChangesFound = true;
      }
    } catch (error) {
      console.log(error);
      console.log(
        "Unable to process destructive Manifest specified in the path or in the project manifest"
      );
      destructiveChangesPath = null;
    }

    return {
      isDestructiveChangesFound: isDestructiveChangesFound,
      destructiveChangesPath: destructiveChangesPath,
      destructiveChanges: destructiveChanges,
    };
  }


  private static xml2json(xml) {
    return new Promise((resolve, reject) => {
      xmlParser.parseString(xml, function (err, json) {
        if (err) reject(err);
        else resolve(json);
      });
    });
  }
 

}

type DestructiveChanges = {
  isDestructiveChangesFound: boolean;
  destructiveChangesPath: string;
  destructiveChanges: any;
};
