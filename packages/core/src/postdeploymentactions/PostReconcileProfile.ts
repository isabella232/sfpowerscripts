import child_process = require("child_process");
import { onExit } from "../OnExit";
import PackageMetadata from "../sfdxwrappers/PackageMetadata";
import  PostDeploymentAction  from "./PostDeploymentAction";
import DeploySourceToOrgImpl from "../sfdxwrappers/DeploySourceToOrgImpl";
const glob = require("glob");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");

export default class PreReconcileProfile implements PostDeploymentAction {
  public constructor(
    private target_org: string,
    private source_directory: string,
    private deploymentOptions:any,
    private packageMetadata: PackageMetadata
  ) {}

  public async exec():Promise<boolean> {


    try {
      if (isReconcileActivated) {
        //Bring back the original profiles
        if (profileFolders.length > 0) {
          profileFolders.forEach((folder) => {
            fs.copySync(
              path.join(tl.getVariable("agent.tempDirectory"), folder),
              path.join(artifactFilePaths.sourceDirectoryPath, folder)
            );
          });


          //Now Reconcile
         //Now Reconcile
         let command = this.buildExecCommand();
         let child = child_process.exec(
           command,
           { encoding: "utf8", cwd: this.source_directory },
           (error, stdout, stderr) => {
             if (error) throw error;
           }
         );
 
         child.stdout.on("data", (data) => {
           console.log(data.toString());
         });
         child.stderr.on("data", (data) => {
           console.log(data.toString());
         });
 
         await onExit(child);

        isReconcileActivated = true;

          //Now deploy the profies alone
          fs.appendFileSync(
            path.join(artifactFilePaths.sourceDirectoryPath, ".forceignore"),
            "**.**" + os.EOL
          );
          fs.appendFileSync(
            path.join(artifactFilePaths.sourceDirectoryPath, ".forceignore"),
            "!**.profile-meta.xml"
          );

          let deploySourceToOrgImpl: DeploySourceToOrgImpl = new DeploySourceToOrgImpl(
            target_org,
            artifactFilePaths.sourceDirectoryPath,
            sourceDirectory,
            this.deploymentOptions,
            false
          );














   
     
        isReconcileActivated = true;
      } catch (err) {
        console.log("Failed to reconcile profiles:" + err);
        isReconcileErrored = true;
      }
    }

    //Reconcile Failed, Bring back the original profiles
    console.log("Restoring original profiles as preprocessing failed");
    if (isReconcileErrored && profileFolders.length > 0) {
      profileFolders.forEach((folder) => {
        fs.copySync(
          path.join(os.tmpdir(), folder),
          path.join(this.source_directory, folder)
        );
      });
    }

    return isReconcileActivated;
  }

  private buildExecCommand(): string {
    let command = `npx sfdx sfpowerkit:source:profile:reconcile -f  ${this.source_directory} -u ${this.target_org}`;
    return command;
  }
}
