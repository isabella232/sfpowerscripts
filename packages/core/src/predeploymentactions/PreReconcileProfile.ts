import child_process = require("child_process");
import { onExit } from "../OnExit";
import PackageMetadata from "../sfdxwrappers/PackageMetadata";
import  PreDeploymentAction  from "./PreDeploymentAction";
const glob = require("glob");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");

export default class PreReconcileProfile implements PreDeploymentAction {
  public constructor(
    private target_org: string,
    private source_directory: string,
    private packageMetadata: PackageMetadata
  ) {}

  public async exec():Promise<boolean> {
    //Apply Reconcile if Profiles are found
    //To Reconcile we have to go for multiple deploys, first we have to reconcile profiles and deploy the metadata
    let isReconcileActivated = false,
      isReconcileErrored = false;
    let profileFolders;
    if (
      this.packageMetadata.isProfilesFound &&
      this.packageMetadata.preDeploymentSteps?.includes("reconcile")
    ) {
      try {
        console.log("Attempting reconcile to profiles");
        //copy the original profiles to temporary location
        profileFolders = glob.sync("**/profiles", {
          cwd: path.join(this.source_directory),
        });
        if (profileFolders.length > 0) {
          profileFolders.forEach((folder) => {
            fs.copySync(
              path.join(this.source_directory, folder),
              path.join(os.tmpdir(), folder)
            );
          });
        }
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
